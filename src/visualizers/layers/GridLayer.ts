/* eslint-disable @typescript-eslint/no-explicit-any */

/* GridLayer to render flooding grids in Deck.GL. We ride along with SolidPolygonLayer
 * that renders the polygons for us based on the grid cells from the flooding grid. We
 * then calculate the waterdepth in the (fragment) shader based on the cell water height
 * and the heightmap (that we passed in as a texture).
 *
 * The basic idea of the shaders is as following:
 *
 * - Every grid cell is a square. We use the SolidPolygonLayer to calculate the mesh for
 *   each grid cell. We only use the "top" model from the SolidPolygonLayer, we don't
 *   care about the sides and also don't use any of its extrusion capabilities.
 * - We make the height map available to the shaders as a texture
 * - In the vertex shader we take the vertex position and use the heightmap bounding box
 *   to calculate its relative (normalized) position on the heightmap texture (beteen
 *   x=0..1 and y=0..1). We pass this position through to the fragment shader (texturePosition)
 * - We also pass through the water height on the vertex (ie in the cell) to the fragment
 *   shader (wh)
 * - In the fragment shader, the texturePosition gets linearly interpolated for every
 *   pixel/fragment in the grid cell, so that we get the correct position for every
 *   pixel. We sample the heightmap texture to obtain the ground height for that pixel.
 * - The water height for each fragment is also interpolated, but since it has the same
 *   value for every vertex in the grid cell, it is constant within the grid cell
 * - We now calculate the water depth (ie the amount of water on top of the ground) by
 *   subtracting the ground height from the water height.
 * - We then need to color the fragment based on the water depth. For this, we've prepared
 *   another - 1px wide - texture that acts as a color mapping. It spans from
 *   ``minColorValue`` to ``maxColorValue`` which are the water depth for the color at
 *   position 0 in the color map texture and the water depth for the color at position
 *   1 in the color map texture. We've sent these two values to the fragment shader as
 *   uniforms.
 * - The fragment shader can now calculate the relative position of the water depth in
 *   color map texture and look up the associated color. If the water depth falls outside
 *   the range of the color map, we clamp it to the edges.
 * - The fragment shader finally colors the pixel
 *
 * We define the following uniforms that we need in order to properly calculate the
 * water depth:
 *
 * - heightMapTexture: the heightmap as a texture. This is a single float/color texture
 *     giving the ground height at subgrid precision.
 * - bbox: The height map bounding box, when coming from a geotiff, the bounding box
 *     has been previously extracted from this geotiff in the GeotiffLoader (see
 *     FloodingGridModule.ts). it is given as [xmin, ymin, xmax, ymax]
 * - colorMap: The colormap as a texture. This is a 1px wide texture. The length of
 *   the texture is configurable but is 51px by default
 * - minColorValue: the water depth value for the beginning of the color map.
 * - maxColorValue: the water depth value for the end of the color map
 *
 * We hook into the SolidPolygonLayer in the following way:
 *
 * - Override the initializeState and updateStateMethod to read our custom props and
 *   add them to the layer state. We also generate the textures
 * - Override the _getModels() method. We only ever render the "top" polygon layer. We
 *   use the documented deck.gl shader injection hooks to add our custom behaviour to
 *   the shaders. Some of the logic in this method is copied from the parent method
 * - Override the draw() method, here we provide our custom uniforms to the shader. In
 *   deck.gl/luma.gl fashion they are namespaced into the ``grid`` struct. The struct
 *   is defined using a "shader module". Some of the logic in this method is copied from
 *   the parent method
 * - Implement the finalizeState method to clean up our textures when the layer is removed
 */

import type { Accessor, LayerContext, UpdateParameters } from "@deck.gl/core";
import { SolidPolygonLayer, type SolidPolygonLayerProps } from "@deck.gl/layers";
import type { Device, Texture } from "@luma.gl/core";

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

interface ColorMapTextureInfo {
  minVal: number;
  maxVal: number;
  texture: Texture;
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

// The "grid" shader module that defines the struct/namespace that we use to pass in
// the uniforms to the shaders
const gridUniforms = {
  name: "grid",
  vs: `
uniform gridUniforms {
  vec4 bbox;
  float minColorValue;
  float maxColorValue;
} grid;
`,
  fs: `
uniform gridUniforms {
  vec4 bbox;
  float minColorValue;
  float maxColorValue;
} grid;
`,
  uniformTypes: {
    bbox: "vec4<f32>",
    minColorValue: "f32",
    maxColorValue: "f32",
  },
};
export type GridLayerProps<DataT> = _GridLayerProps<DataT> & SolidPolygonLayerProps<DataT>;

export default class GridLayer<D> extends SolidPolygonLayer<D, GridLayerProps<D>> {
  declare state: SolidPolygonLayer["state"] & {
    bbox: [number, number, number, number];
    texture: Texture;
    colorMapTexture: Texture | null;
    minColorValue: number | null;
    maxColorValue: number | null;
    hasError: boolean;
  };

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
    if (props.texture !== oldProps.texture) {
      const textureInfo = props.texture ?? {
        data: new Float32Array([0]),
        width: 1,
        height: 1,
        bbox: [0, 0, 1, 1],
      };
      this.assertCompatibleTextureSize(textureInfo);
      this.setState({
        texture: createTexture(textureInfo, this.context.device),
        bbox: textureInfo.bbox,
      });
    }
    if (!isEqual(props.colorMap, oldProps.colorMap)) {
      const cm = props.colorMap ? createColorMapTexture(props.colorMap, this.context.device) : null;

      this.setState({
        colorMapTexture: cm?.texture ?? null,
        minColorValue: cm?.minVal ?? null,
        maxColorValue: cm?.maxVal ?? null,
      });
    }
  }
  assertCompatibleTextureSize(texture: TextureInfo) {
    const gl = (this.context.device as any).gl as WebGL2RenderingContext;
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    let error = false;
    if (texture.width > maxTextureSize || texture.height > maxTextureSize) {
      this.raiseError(new Error("Heightmap is too large to render"), "");
      error = true;
    }
    this.setState({ hasError: error });
  }
  _getModels() {
    const { id } = this.props;

    const shaders = this.getShaders("top");
    shaders.defines.NON_INSTANCED_MODEL = 1;
    shaders.modules.push(gridUniforms);
    const bufferLayout = this.getAttributeManager()!.getBufferLayouts({ isInstanced: false });
    const topModel = new Model(this.context.device, {
      ...shaders,
      id,
      topology: "triangle-list",
      bufferLayout,
      isIndexed: true,
      userData: {
        excludeAttributes: { instanceVertexValid: true },
      },
      inject: {
        "vs:#decl": `
                  in float instanceValue;

                  out vec2 texturePosition;
                  out float wh;
              `,
        "vs:#main-end": `
                  vec2 bbox0 = grid.bbox.xy;
                  vec2 bbox1 = grid.bbox.zw;
                  texturePosition = (props.positions.xy - bbox0) / (bbox1 - bbox0);
                  wh = instanceValue;
              `,
        "fs:#decl": `
                  uniform sampler2D heightMapTexture;
                  uniform sampler2D colorMap;
                  in vec2 texturePosition;
                  in float wh;
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

                  float groundHeight = texture(heightMapTexture, texturePosition).r;
                  if (groundHeight < -900.0 ) {
                      discard;
                  }

                  float waterDepth = wh - groundHeight;
                  if (waterDepth < 0.0) {
                      discard;
                  }

                  float colorTexturePosX = (waterDepth - grid.minColorValue) / (grid.maxColorValue - grid.minColorValue);
                  vec4 mappedColor = texture(colorMap, vec2(colorTexturePosX, 0.5));

                  color = vec4(mappedColor.rgb, layer.opacity * mappedColor.a);
              `,
      },
    });
    return {
      models: [topModel],
      topModel,
      sideModel: null,
    } as any;
  }
  draw() {
    const topModel = this.state.topModel!;
    const {
      polygonTesselator,
      texture,
      colorMapTexture,
      minColorValue,
      maxColorValue,
      bbox,
      hasError,
    } = this.state;
    if (hasError) return;

    const renderUniforms = {
      extruded: false,
      elevationScale: 1,
      isWireframe: false,
    };

    topModel.setVertexCount(polygonTesselator.vertexCount);
    topModel.shaderInputs.setProps({
      solidPolygon: renderUniforms,
      // luma.gl requires us to put all required uniforms in a namespace (ie ``"grid"``)
      // they are then bound to a struct ``gridUniforms`` (see the definition of the shader
      // module earlier in this file). There is one (magical) exception: namely textures,
      // they are bound at the top level and are not namespaces (I could not find any
      // documentation about this, but it seems to work like this...)
      grid: {
        heightMapTexture: texture,
        colorMap: colorMapTexture,
        bbox,
        minColorValue,
        maxColorValue,
      },
    });
    topModel.draw(this.context.renderPass);
  }
  finalizeState(context: LayerContext) {
    super.finalizeState(context);
    this.state.colorMapTexture?.destroy();
    this.state.texture?.destroy();
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
    sampler: {
      mipmapFilter: "none",
      minFilter: "nearest",
      magFilter: "nearest",
    },
  });
}

export function expandColorMap(colormap: [number, RGBAColor][], nSteps = 51, ensureRGBA = false) {
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

function createColorMapTexture(
  colormap: [number, RGBAColor][],
  device: Device,
  nPixels = 51,
): ColorMapTextureInfo {
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
      sampler: {
        mipmapFilter: "none",
        minFilter: "nearest",
        magFilter: "nearest",
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
      },
    }),
  };
}
