import { VisualizerContext } from './visualizers';
import { FlowVisualizerType, Nullable } from '../types';
import { ComposableVisualizerInfo } from './VisualizerInfo';
import {
  ComposableArcVisualizer,
  ComposableIconVisualizer,
  ComposableLineVisualizer,
  ComposablePointVisualizer,
  ComposablePolygonVisualizer
} from './composableVisualizers';

export type Visualizer =
  | ComposablePointVisualizer
  | ComposableLineVisualizer
  | ComposablePolygonVisualizer
  | ComposableArcVisualizer
  | ComposableIconVisualizer;

export interface VisualizerConstructor {
  new (config: VisualizerContext): Visualizer;
}

export function getVisualizer(config: VisualizerContext): Visualizer {
  const visClass = getVisualizerType(config.info);
  if (!visClass) {
    throw new Error(`Cannot visualize ${config.info.id}`);
  }

  return new visClass(config);
}

export function getVisualizerType(info: ComposableVisualizerInfo): Nullable<VisualizerConstructor> {
  switch (info.settings?.type) {
    case FlowVisualizerType.POINTS:
      return ComposablePointVisualizer;
    case FlowVisualizerType.LINES:
      return ComposableLineVisualizer;
    case FlowVisualizerType.POLYGONS:
      return ComposablePolygonVisualizer;
    case FlowVisualizerType.ARCS:
      return ComposableArcVisualizer;
    case FlowVisualizerType.ICONS:
      return ComposableIconVisualizer;
    default:
      return null;
  }
}
