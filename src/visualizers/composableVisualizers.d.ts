/// <reference types="deck.gl" />
import { SinglePropertyTapefile } from '@/visualizers/tapefile';
import { AnyVisualizerInfo } from '@/visualizers/VisualizerInfo';
import { Layer } from '@deck.gl/core';
import { ComponentProperty, Coordinate, EntityGroupData, LayerConstructor, LayerParams, LineCoordinate, LineGeometryData, PointCoordinate, PointGeometryData, PolygonCoordinate, PolygonGeometryData, TopologyLayerData, VisualizableDataTypes, VisualizerCallbacks } from '@/types';
import { PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { BaseVisualizer, VisualizerContext } from './visualizers';
import { LineTopologyGetter, PointTopologyGetter, PolygonTopologyGetter } from './geometry';
import { VisualizerModule } from './visualizerModules';
declare abstract class ComposableVisualizer<EntityData extends EntityGroupData<Coordinate | number>, Coord extends Coordinate, LData extends TopologyLayerData<Coord>, Layer_ extends Layer<LData>> extends BaseVisualizer<EntityData, Coordinate, LData, Layer_> implements VisualizerCallbacks {
    attributes: Record<string, ((t: SinglePropertyTapefile<VisualizableDataTypes>) => void)[]>;
    tapefiles: Record<string, SinglePropertyTapefile<VisualizableDataTypes>>;
    topology?: LData[];
    modules: VisualizerModule<Coord, LData>[] | null;
    constructor(config: VisualizerContext);
    abstract getModules(): VisualizerModule<Coord, LData>[];
    abstract getDefaultParams(): LayerParams<LData, Coord>;
    mustReload(): boolean;
    doLoad(): Promise<void>;
    private compose;
    ensureModules(): VisualizerModule<Coord, LData>[];
    setInfo(info: AnyVisualizerInfo): void;
    requestTapefile(attribute: ComponentProperty, onLoad: (t: SinglePropertyTapefile<VisualizableDataTypes>) => void): void;
    ensureTapefiles(): Promise<void>;
    distributeTapefiles(): void;
    updateTimestamp(timestamp: number): void;
    getLayer(timestamp: number): any;
}
export declare class ComposablePointVisualizer extends ComposableVisualizer<PointGeometryData, PointCoordinate, TopologyLayerData<PointCoordinate>, ScatterplotLayer<TopologyLayerData<PointCoordinate>>> {
    getModules(): VisualizerModule<PointCoordinate, TopologyLayerData<PointCoordinate>>[];
    get topologyGetter(): PointTopologyGetter;
    getDefaultParams(): LayerParams<TopologyLayerData<PointCoordinate>, PointCoordinate>;
}
export declare class ComposableLineVisualizer extends ComposableVisualizer<LineGeometryData, LineCoordinate, TopologyLayerData<LineCoordinate>, PathLayer<TopologyLayerData<LineCoordinate>>> {
    get topologyGetter(): LineTopologyGetter;
    getModules(): VisualizerModule<import("@/types").CoordinateArray, TopologyLayerData<import("@/types").CoordinateArray>>[];
    getDefaultParams(): LayerParams<TopologyLayerData<LineCoordinate>, LineCoordinate>;
}
export declare class ComposablePolygonVisualizer extends ComposableVisualizer<PolygonGeometryData, PolygonCoordinate, TopologyLayerData<PolygonCoordinate>, PolygonLayer<TopologyLayerData<PolygonCoordinate>>> {
    get topologyGetter(): PolygonTopologyGetter;
    getModules(): VisualizerModule<import("@/types").CoordinateArray, TopologyLayerData<import("@/types").CoordinateArray>>[];
    getDefaultParams(): {
        type: LayerConstructor<TopologyLayerData<import("@/types").CoordinateArray>, unknown>;
        props: {
            id: string;
            data: TopologyLayerData<import("@/types").CoordinateArray>[] | undefined;
            lineJointRounded: boolean;
            visible: boolean;
            getPolygon: (d: TopologyLayerData<PolygonCoordinate>) => import("@/types").CoordinateArray;
            parameters: {
                depthTest: boolean;
            };
            updateTriggers: {};
        };
    };
}
export declare class ComposableArcVisualizer extends ComposableLineVisualizer {
    getDefaultParams(): LayerParams<TopologyLayerData<LineCoordinate>, LineCoordinate>;
}
export {};
