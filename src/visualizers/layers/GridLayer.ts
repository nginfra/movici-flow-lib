/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Accessor, UpdateParameters } from "@deck.gl/core";
import { SolidPolygonLayer, type SolidPolygonLayerProps } from "@deck.gl/layers";
import type { Device } from "@luma.gl/core";

import { Model } from "@luma.gl/engine";
import type { RGBAColor } from "@movici-flow-lib/types";
import { ensureRGBAColorMap } from "@movici-flow-lib/utils/colorUtils";
import isEqual from "lodash/isEqual";

interface TextureInfo {
  height: number;
  width: number;
  data: Float32Array;
}
interface GeoTextureInfo extends TextureInfo {
  bbox: [number, number, number, number];
}

type _GridLayerProps<DataT> = {
  /** Cell value accessor.
   * @default 0
   */
  getCellValue?: Accessor<DataT, number>;

  /** texture info, such as a height map.
   * @default null
   */
  texture?: GeoTextureInfo;

  /** color map for rendering colors
   * @default null
   */
  colorMap?: [number, RGBAColor][];
};

export type GridLayerProps<DataT> = _GridLayerProps<DataT> & SolidPolygonLayerProps<DataT>;

export default class GridLayer<D> extends SolidPolygonLayer<D, GridLayerProps<D>> {
  initializeState() {
    super.initializeState();
    const attributeManager = this.getAttributeManager()!;
    attributeManager.add({
      instanceValue: {
        size: 1,
        accessor: "getCellValue",
        defaultValue: 0,
      },
    });
  }
  updateState(updateParams: UpdateParameters<this>) {
    super.updateState(updateParams);

    const { props, oldProps } = updateParams;
    const attributeManager = this.getAttributeManager();

    const regenerateModels =
      props.texture !== oldProps.texture || !isEqual(props.colorMap, oldProps.colorMap);
    if (regenerateModels) {
      this.state.models?.forEach((model) => model.destroy());
      this.setState(this._getModels());
      attributeManager!.invalidateAll();
    }
    this.state.topModel?.shaderInputs.setProps({
      grid: {
        opacity: this.props.opacity,
      },
    });
  }
  _getModels() {
    const { id, colorMap } = this.props;

    const shaders = this.getShaders("top");
    shaders.defines.NON_INSTANCED_MODEL = 1;

    const textureInfo = this.props.texture ?? {
      data: new Float32Array([0]),
      width: 1,
      height: 1,
      bbox: [0, 0, 1, 1],
    };
    const texture = createTexture(textureInfo, this.context.device);
    const bbox = textureInfo.bbox;

    const cm = colorMap ? createColorMapTexture(colorMap, this.context.device) : null;
    const topModel = new Model(this.context.device, {
      ...shaders,
      id,
      attributes: {
        vertexPositions: new Float32Array([0, 1]),
      },
      uniforms: {
        isWireframe: false,
        isSideVertex: false,
        texture,
        bbox,
        colorMap: cm?.texture ?? null,
        minColorValue: cm?.minVal ?? null,
        maxColorValue: cm?.maxVal ?? null,
      },
      vertexCount: 0,
      isIndexed: true,
      inject: {
        "vs:#decl": `
                  uniform vec4 bbox;
                  attribute float instanceValue;

                  varying vec2 texturePosition;
                  varying float wh;
              `,
        "vs:#main-end": `
                  vec2 bbox0 = bbox.xy;
                  vec2 bbox1 = bbox.zw;
                  texturePosition = (positions.xy - bbox0) / (bbox1 - bbox0);
                  wh = instanceValue;
              `,
        "fs:#decl": `
                  uniform sampler2D texture;
                  uniform float minColorValue;
                  uniform float maxColorValue;
                  uniform sampler2D colorMap;
                  uniform float opacity;
                  varying vec2 texturePosition;
                  varying float wh;
              `,
        "fs:DECKGL_FILTER_COLOR": `
                  if (
                          texturePosition.x < 0.0 ||
                          texturePosition.x > 1.0 ||
                          texturePosition.y < 0.0 ||
                          texturePosition.y > 1.0
                      ) {
                      discard;
                  }

                  float groundHeight = texture2D(texture, texturePosition).r;
                  if (groundHeight < -900.0 ) {
                      discard;
                  }

                  float waterDepth = wh - groundHeight;
                  if (waterDepth < 0.0) {
                      discard;
                  }

                  float colorTexturePosX = (waterDepth - minColorValue) / (maxColorValue - minColorValue);
                  vec4 mappedColor = texture2D(colorMap, vec2(colorTexturePosX, 0.5));

                  color = vec4(mappedColor.rgb, opacity * mappedColor.a);
              `,
      },
    });

    return {
      models: [topModel],
      topModel,
      sideModel: null,
    } as any;
  }
}

GridLayer.layerName = "GridLayer";
GridLayer.defaultProps = {
  texture: { type: "object", value: null, async: true },
  getCellValue: { type: "accessor", value: 0 },
  colorMap: { type: "object", value: null },
} as any;

function createTexture({ height, width, data }: TextureInfo, device: Device) {
  return device.createTexture({
    width: width,
    height: height,
    format: "r32float",
    data: data,
    sampler: device.createSampler({
      mipmapFilter: "none",
      minFilter: "nearest",
      magFilter: "nearest",
    }),
  });
}

export function expandColorMap(colormap: [number, RGBAColor][], nSteps = 50, ensureRGBA = false) {
  /**
   * expands and linearizes a colormap so the step sizes are uniform, expands to nSteps number of
   * steps
   */
  if (colormap.length < 2) throw new Error("Color map must be at least of length 2");
  for (let i = 0; i < colormap.length - 2; i++) {
    const step = colormap[i + 1]![0] - colormap[i]![0];
    if (step <= 0) throw new Error("Color map must be monotonically increasing");
  }
  if (ensureRGBA) {
    colormap = ensureRGBAColorMap(colormap);
  }
  const minVal = colormap[0]![0],
    maxVal = colormap[colormap.length - 1]![0],
    stepSize = (maxVal - minVal) / (nSteps - 1);
  let currentMapIndex = 0;
  let currentColor = colormap[currentMapIndex]![1];
  const result: [number, RGBAColor][] = [];
  let val;
  for (val = minVal; val < maxVal; val += stepSize) {
    while (currentMapIndex < colormap.length - 1 && val >= colormap[currentMapIndex + 1]![0]) {
      currentMapIndex++;
      currentColor = colormap[currentMapIndex]![1];
    }
    result.push([val, currentColor]);
  }
  result.push([val, colormap[colormap.length - 1]![1]]);
  return result;
}

function createColorMapTexture(colormap: [number, RGBAColor][], device: Device, nPixels = 50) {
  const linearized = expandColorMap(colormap, nPixels, true);
  const minVal = linearized[0]![0],
    maxVal = linearized[linearized.length - 1]![0],
    stepSize = linearized[1]![0] - minVal;
  return {
    minVal: minVal,
    maxVal: maxVal + stepSize,
    texture: device.createTexture({
      width: linearized.length,
      height: 1,
      data: new Uint8Array(linearized.map((r) => r[1] as [number, number, number, number]).flat()),
      sampler: device.createSampler({
        mipmapFilter: "none",
        minFilter: "nearest",
        magFilter: "nearest",
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
      }),
    }),
  };
}
