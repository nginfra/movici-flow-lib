import { ByValueSizeClause, FlowVisualizerType, StaticSizeClause } from '@movici-flow-common/types';
import { DIMENSIONS } from '@movici-flow-common/visualizers/visualizers';

export const STATIC_DEFAULT_CONFIG: StaticSizeClause = {
    size: DIMENSIONS.SIZE_MIN_PIXELS,
    units: 'pixels',
    minPixels: DIMENSIONS.SIZE_MIN_PIXELS,
    maxPixels: DIMENSIONS.SIZE_MAX_PIXELS
  },
  STATIC_ICON_DEFAULT_CONFIG: StaticSizeClause = {
    size: DIMENSIONS.ICON_SIZE,
    units: 'pixels',
    minPixels: DIMENSIONS.ICON_SIZE_MIN_PIXELS,
    maxPixels: DIMENSIONS.ICON_SIZE_MAX_PIXELS
  },
  BY_VALUE_DEFAULT_CONFIG: ByValueSizeClause = {
    sizes: [
      [2, DIMENSIONS.SIZE_MIN_PIXELS],
      [4, DIMENSIONS.SIZE_MIN_PIXELS * 2]
    ],
    units: 'pixels',
    minPixels: DIMENSIONS.SIZE_MIN_PIXELS,
    maxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
    attribute: null
  },
  BY_VALUE_ICON_DEFAULT_CONFIG: ByValueSizeClause = {
    sizes: [
      [2, DIMENSIONS.ICON_SIZE],
      [4, DIMENSIONS.ICON_SIZE * 2]
    ],
    units: 'pixels',
    minPixels: DIMENSIONS.ICON_SIZE_MIN_PIXELS,
    maxPixels: DIMENSIONS.ICON_SIZE_MAX_PIXELS,
    attribute: null
  },
  STATIC_DEFAULT_SIZES = Object.values(FlowVisualizerType).reduce((prev, curr) => {
    prev[curr] = (() => {
      switch (curr) {
        case FlowVisualizerType.ICONS:
          return STATIC_ICON_DEFAULT_CONFIG;
        case FlowVisualizerType.POINTS:
        case FlowVisualizerType.LINES:
        case FlowVisualizerType.POLYGONS:
        case FlowVisualizerType.ARCS:
        default:
          return STATIC_DEFAULT_CONFIG;
      }
    })();

    return prev;
  }, {} as Record<FlowVisualizerType, StaticSizeClause>),
  BY_VALUE_DEFAULT_SIZES = Object.values(FlowVisualizerType).reduce((prev, curr) => {
    prev[curr] = (() => {
      switch (curr) {
        case FlowVisualizerType.ICONS:
          return BY_VALUE_ICON_DEFAULT_CONFIG;
        case FlowVisualizerType.POINTS:
        case FlowVisualizerType.LINES:
        case FlowVisualizerType.POLYGONS:
        case FlowVisualizerType.ARCS:
        default:
          return BY_VALUE_DEFAULT_CONFIG;
      }
    })();

    return prev;
  }, {} as Record<FlowVisualizerType, ByValueSizeClause>);
