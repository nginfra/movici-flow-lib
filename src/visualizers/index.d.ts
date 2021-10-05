import { StaticLineVisualizer, StaticPointVisualizer, StaticPolygonVisualizer } from './staticVisualizers';
import { VisualizerContext } from './visualizers';
import { TapefileLineVisualizer, TapefilePointVisualizer, TapefilePolygonVisualizer } from '@/visualizers/tapefileVisualizers';
import { ActivePointVisualizer } from '@/visualizers/activeEntityVisualizers';
import { Nullable } from '@/types';
import { AnyVisualizerInfo, ComposableVisualizerInfo, VisualizerInfo } from '@/visualizers/VisualizerInfo';
import { ComposableLineVisualizer, ComposablePointVisualizer, ComposablePolygonVisualizer } from '@/visualizers/composableVisualizers';
export declare type Visualizer = StaticPointVisualizer | StaticLineVisualizer | StaticPolygonVisualizer | TapefilePointVisualizer | TapefileLineVisualizer | TapefilePolygonVisualizer | ActivePointVisualizer | ComposablePointVisualizer | ComposableLineVisualizer | ComposablePolygonVisualizer;
export interface VisualizerConstructor {
    new (config: VisualizerContext): Visualizer;
}
export declare function getVisualizer(config: VisualizerContext): Visualizer;
export declare function getVisualizerType(info: AnyVisualizerInfo): Nullable<VisualizerConstructor>;
export declare function getLegacyVisualizerType(info: VisualizerInfo): Nullable<VisualizerConstructor>;
export declare function getComposableVisualizerType(info: ComposableVisualizerInfo): Nullable<VisualizerConstructor>;
export { VisualizerInfo } from '@/visualizers/VisualizerInfo';
export interface VisGroup {
    name: string;
    layerInfos: AnyVisualizerInfo[];
}
