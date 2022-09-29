import { CompositeLayer } from '@deck.gl/core';
import { IconLayer } from '@deck.gl/layers';
import { CompositeLayerProps } from '@deck.gl/core/lib/composite-layer';
import { PointCoordinate, RGBAColor, TopologyLayerData } from '@movici-flow-common/types';
import { getContrastingColor } from '@movici-flow-common/utils/colorUtils';
import { IconPackName } from '../visualizerModules/iconCommon';

const FALLBACK_ICON = 'question',
  FALLBACK_SHAPE = 'map-marker',
  LOAD_OPTIONS = {
    imagebitmap: {
      resizeQuality: 'high'
    }
  };

function getValue<D, T extends number | boolean | string>(
  d: D,
  accessor?: ((_: D) => T) | T
): T | null {
  if (!accessor) return null;
  if (typeof accessor === 'function') {
    return accessor(d);
  }
  return accessor;
}

export default class ShapeIconLayer<D> extends CompositeLayer<
  D,
  CompositeLayerProps<D> & ShapeIconProps<D>
> {
  renderLayers() {
    const layers = [];

    if (this.props.hasShape) {
      layers.push(this.getShapeLayer(this.props));
    }

    if (this.props.hasIcon) {
      layers.push(this.getIconLayer(this.props));
    }

    return layers;
  }

  getIconLayer({
    data,
    hasIcon,
    hasShape,
    getPosition,
    getSize,
    getColor,
    getShape,
    shapeMapping,
    getIcon,
    iconAtlas,
    iconMapping,
    sizeMinPixels,
    sizeMaxPixels
  }: CompositeLayerProps<D> & ShapeIconProps<D>) {
    const hasIconAndShape = hasIcon && hasShape,
      getPixelOffset = hasIconAndShape
        ? (d: D) => {
            const shape = getValue(d, getShape) ?? FALLBACK_ICON,
              iconCenter = shapeMapping?.[shape]?.iconCenter ?? [0, 0],
              size = typeof getSize === 'function' ? getSize(d) : getSize;
            return iconCenter.map(i => i * size);
          }
        : [0, 0],
      getIconColor = hasIconAndShape
        ? (d: D) => {
            return getContrastingColor(typeof getColor === 'function' ? getColor(d) : getColor);
          }
        : getColor,
      getIconSize = hasIconAndShape
        ? (d: D) => {
            const icon = getValue(d, getIcon) ?? FALLBACK_ICON,
              sizeScale = iconMapping?.[icon]?.inShapeSize ?? 0.5,
              size = typeof getSize === 'function' ? getSize(d) : getSize;
            return size * sizeScale;
          }
        : getSize;
    return new IconLayer(
      this.getSubLayerProps({
        id: 'icon',
        data,
        iconAtlas,
        iconMapping,
        getPosition,
        getIcon,
        getColor: getIconColor,
        getSize: getIconSize,
        getPixelOffset,
        sizeMinPixels: sizeMinPixels ? sizeMinPixels : 0,
        sizeMaxPixels: sizeMaxPixels ? sizeMaxPixels : Number.MAX_SAFE_INTEGER,
        updateTriggers: {
          getPosition: this.props.updateTriggers.getPosition,
          getIcon: this.props.updateTriggers.getIcon,
          getSize: [
            ...(this.props.updateTriggers.getIcon ?? []),
            ...(this.props.updateTriggers.getSize ?? []),
            hasIcon,
            hasShape
          ],
          getColor: [...(this.props.updateTriggers.getColor ?? []), hasIcon, hasShape],
          getPixelOffset: [
            ...(this.props.updateTriggers.getShape ?? []),
            ...(this.props.updateTriggers.getSize ?? []),
            hasIcon,
            hasShape
          ],
          iconAtlas: this.props.updateTriggers.iconAtlas,
          iconMapping: this.props.updateTriggers.iconMapping
        },
        loadOptions: LOAD_OPTIONS
      })
    );
  }

  getShapeLayer({
    data,
    getPosition,
    getShape,
    shapeAtlas,
    shapeMapping,
    getSize,
    getColor,
    sizeMinPixels,
    sizeMaxPixels
  }: CompositeLayerProps<D> & ShapeIconProps<D>) {
    return new IconLayer(
      this.getSubLayerProps({
        id: 'shape',
        data,
        iconAtlas: shapeAtlas,
        iconMapping: shapeMapping,
        getPosition,
        getIcon: getShape,
        getColor,
        getSize,
        sizeMinPixels: sizeMinPixels ? sizeMinPixels : 0,
        sizeMaxPixels: sizeMaxPixels ? sizeMaxPixels : Number.MAX_SAFE_INTEGER,
        updateTriggers: {
          getPosition: this.props.updateTriggers.getPosition,
          getIcon: this.props.updateTriggers.getShape,
          getSize: this.props.updateTriggers.getSize,
          getColor: this.props.updateTriggers.getColor,
          getPixelOffset: this.props.updateTriggers.getPixelOffset,
          iconAtlas: this.props.updateTriggers.shapeAtlas,
          iconMapping: this.props.updateTriggers.shapeMapping
        },
        loadOptions: LOAD_OPTIONS
      })
    );
  }
}

ShapeIconLayer.layerName = 'ShapeIconLayer';

ShapeIconLayer.defaultProps = {
  hasIcon: false,
  getIcon: { type: 'accessor', value: FALLBACK_ICON },
  hasShape: false,
  getShape: { type: 'accessor', value: FALLBACK_SHAPE },
  getColor: { type: 'accessor', value: [0, 0, 0, 255] },
  getSize: { type: 'accessor', value: 25 },
  getPosition: {
    type: 'accessor',
    value: (d: TopologyLayerData<PointCoordinate>) => d.coordinates
  }
};

interface ShapeIconProps<D> {
  hasIcon: boolean;
  hasShape: boolean;
  // Ideally, getIcon and getShape would accept string values instead of only accessor function
  // however, deck.gl IconLayer only supports accessor functions for getIcon
  getIcon?: (_: D) => string;
  getShape?: (_: D) => string;
  iconMapping?: IconMapping;
  shapeMapping?: IconMapping;
  iconAtlas?: string;
  shapeAtlas?: string;
  iconPack?: IconPackName;
  getColor: ((_: D) => RGBAColor) | RGBAColor;
  getSize: ((_: D) => number) | number;
  getPosition: (_: D) => PointCoordinate;
  sizeMinPixels?: number;
  sizeMaxPixels?: number;
}

export type IconMapping = Record<string, IconMappingItem>;
export type IconMappingOverrides = Record<string, Partial<IconMappingItem>>;
export interface IconMappingItem {
  url?: string;
  width: number;
  height: number;
  anchorX?: number;
  anchorY?: number;
  mask?: boolean;
  inShapeSize?: number;
  iconCenter?: number[];
}
