import {
  StaticLineVisualizer,
  StaticPointVisualizer,
  StaticPolygonVisualizer
} from './staticVisualizers';
import { VisualizerContext } from './visualizers';
import {
  TapefileLineVisualizer,
  TapefilePointVisualizer,
  TapefilePolygonVisualizer
} from '@/flow/src/visualizers/tapefileVisualizers';
import { ActivePointVisualizer } from '@/flow/src/visualizers/activeEntityVisualizers';
import { FlowVisualizerType, LayerKind, Nullable } from '@/flow/src/types';
import { EntityGeometry } from '@/flow/src/types/geometry';
import {
  AnyVisualizerInfo,
  ComposableVisualizerInfo,
  VisualizerInfo
} from '@/flow/src/visualizers/VisualizerInfo';
import {
  ComposableArcVisualizer,
  ComposableLineVisualizer,
  ComposablePointVisualizer,
  ComposablePolygonVisualizer
} from '@/flow/src/visualizers/composableVisualizers';

export type Visualizer =
  | StaticPointVisualizer
  | StaticLineVisualizer
  | StaticPolygonVisualizer
  | TapefilePointVisualizer
  | TapefileLineVisualizer
  | TapefilePolygonVisualizer
  | ActivePointVisualizer
  | ComposablePointVisualizer
  | ComposableLineVisualizer
  | ComposablePolygonVisualizer;

export interface VisualizerConstructor {
  new (config: VisualizerContext): Visualizer;
}

const SUPPORTED_VISUALIZERS: Record<
  LayerKind,
  Record<EntityGeometry, VisualizerConstructor | null>
> = {
  [LayerKind.STATIC_COLOR]: {
    [EntityGeometry.POINT]: StaticPointVisualizer,
    [EntityGeometry.LINE]: StaticLineVisualizer,
    [EntityGeometry.POLYGON]: StaticPolygonVisualizer
  },
  [LayerKind.HEAT_MAP]: {
    [EntityGeometry.POINT]: StaticPointVisualizer,
    [EntityGeometry.LINE]: null,
    [EntityGeometry.POLYGON]: null
  },
  [LayerKind.ACTIVE_ENTITY]: {
    [EntityGeometry.POINT]: ActivePointVisualizer,
    [EntityGeometry.LINE]: null,
    [EntityGeometry.POLYGON]: null
  },
  [LayerKind.COLOR_MAP]: {
    [EntityGeometry.POINT]: TapefilePointVisualizer,
    [EntityGeometry.LINE]: TapefileLineVisualizer,
    [EntityGeometry.POLYGON]: TapefilePolygonVisualizer
  },
  [LayerKind.UNKNOWN]: {
    [EntityGeometry.POINT]: null,
    [EntityGeometry.LINE]: null,
    [EntityGeometry.POLYGON]: null
  }
};

export function getVisualizer(config: VisualizerContext): Visualizer {
  const visClass = getVisualizerType(config.info);
  if (!visClass) {
    throw new Error(`Cannot visualize ${config.info.id}`);
  }

  return new visClass(config);
}

export function getVisualizerType(info: AnyVisualizerInfo): Nullable<VisualizerConstructor> {
  return info instanceof ComposableVisualizerInfo
    ? getComposableVisualizerType(info)
    : getLegacyVisualizerType(info);
}

export function getLegacyVisualizerType(info: VisualizerInfo): Nullable<VisualizerConstructor> {
  return info.geometry ? SUPPORTED_VISUALIZERS[info.settings.kind][info.geometry] : null;
}
export function getComposableVisualizerType(
  info: ComposableVisualizerInfo
): Nullable<VisualizerConstructor> {
  switch (info.settings?.type) {
    case FlowVisualizerType.POINTS:
      return ComposablePointVisualizer;
    case FlowVisualizerType.LINES:
      return ComposableLineVisualizer;
    case FlowVisualizerType.POLYGONS:
      return ComposablePolygonVisualizer;
    case FlowVisualizerType.ARCS:
      return ComposableArcVisualizer;
    default:
      return null;
  }
}
export { VisualizerInfo } from '@/flow/src/visualizers/VisualizerInfo';

export interface VisGroup {
  name: string;
  layerInfos: AnyVisualizerInfo[];
}
