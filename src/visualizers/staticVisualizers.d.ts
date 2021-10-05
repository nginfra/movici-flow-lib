/// <reference types="deck.gl" />
import { Coordinate, EntityGroupData, LineCoordinate, LineGeometryData, PointCoordinate, PointGeometryData, PolygonCoordinate, PolygonGeometryData, TopologyLayerData } from '@/types';
import { PathLayer, ScatterplotLayer, PolygonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { LineTopologyGetter, PointTopologyGetter, PolygonTopologyGetter } from './geometry';
import { Layer } from '@deck.gl/core';
import { BaseVisualizer, VisualizerContext } from './visualizers';
export declare abstract class StaticDatasetVisualizer<EntityData extends EntityGroupData<Coordinate | number>, Coord extends Coordinate, LData extends TopologyLayerData<Coord>, Layer_ extends Layer<LData>> extends BaseVisualizer<EntityData, Coord, LData, Layer_> {
    protected constructor(config: VisualizerContext);
    doLoad(): Promise<void>;
}
export declare class StaticPointVisualizer extends StaticDatasetVisualizer<PointGeometryData, PointCoordinate, TopologyLayerData<PointCoordinate>, ScatterplotLayer<TopologyLayerData<PointCoordinate>> | HeatmapLayer<TopologyLayerData<PointCoordinate>>> {
    constructor(config: VisualizerContext);
    get topologyGetter(): PointTopologyGetter;
    getLayer(): ScatterplotLayer<TopologyLayerData<PointCoordinate>, import("@deck.gl/layers").ScatterplotLayerProps<TopologyLayerData<PointCoordinate>>> | HeatmapLayer<TopologyLayerData<PointCoordinate>, import("@deck.gl/aggregation-layers/heatmap-layer/heatmap-layer").HeatmapLayerProps<TopologyLayerData<PointCoordinate>>>;
}
export declare class StaticLineVisualizer extends StaticDatasetVisualizer<LineGeometryData, LineCoordinate, TopologyLayerData<LineCoordinate>, PathLayer<TopologyLayerData<LineCoordinate>>> {
    constructor(config: VisualizerContext);
    get topologyGetter(): LineTopologyGetter;
    getLayer(): PathLayer<TopologyLayerData<import("@/types").CoordinateArray>, import("@deck.gl/layers").PathLayerProps<TopologyLayerData<import("@/types").CoordinateArray>>>;
}
export declare class StaticPolygonVisualizer extends StaticDatasetVisualizer<PolygonGeometryData, PolygonCoordinate, TopologyLayerData<PolygonCoordinate>, PolygonLayer<TopologyLayerData<PolygonCoordinate>>> {
    constructor(config: VisualizerContext);
    get topologyGetter(): PolygonTopologyGetter;
    getLayer(): PolygonLayer<TopologyLayerData<import("@/types").CoordinateArray>, import("@deck.gl/layers").PolygonLayerProps<TopologyLayerData<import("@/types").CoordinateArray>>>;
}
