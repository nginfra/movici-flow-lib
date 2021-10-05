/// <reference types="deck.gl" />
import { BaseVisualizer, VisualizerContext } from '@/visualizers/visualizers';
import { RGBAColor, Coordinate, EntityGroupData, LineCoordinate, LineGeometryData, PointCoordinate, PointGeometryData, PolygonCoordinate, PolygonGeometryData, TopologyLayerData } from '@/types';
import { Layer } from '@deck.gl/core';
import { SinglePropertyTapefile } from '@/visualizers/tapefile';
import { PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { LineTopologyGetter, PointTopologyGetter, PolygonTopologyGetter } from '@/visualizers/geometry';
import { NumberColorMap } from '@/visualizers/maps/colorMaps';
export declare abstract class TapefileVisualizer<EntityData extends EntityGroupData<Coordinate | number>, PropertyData extends number, // only support single value property data types (ie number) for now
Coord extends Coordinate, LData extends TopologyLayerData<Coord>, Layer_ extends Layer<LData>> extends BaseVisualizer<EntityData, Coord, LData, Layer_> {
    tapefile: null | SinglePropertyTapefile<PropertyData>;
    state: null | PropertyData[];
    colorMap?: NumberColorMap;
    constructor(config: VisualizerContext);
    doLoad(): Promise<void>;
    getColor(obj: LData): RGBAColor;
    updateColorMap(): void;
    updateEntityData(timestamp: number): void;
}
export declare class TapefilePointVisualizer extends TapefileVisualizer<PointGeometryData, number, PointCoordinate, TopologyLayerData<PointCoordinate>, ScatterplotLayer<TopologyLayerData<PointCoordinate>> | HeatmapLayer<TopologyLayerData<PointCoordinate>>> {
    constructor(config: VisualizerContext);
    get topologyGetter(): PointTopologyGetter;
    getLayer(timestamp: number): ScatterplotLayer<TopologyLayerData<PointCoordinate>, import("@deck.gl/layers").ScatterplotLayerProps<TopologyLayerData<PointCoordinate>>>;
}
export declare class TapefileLineVisualizer extends TapefileVisualizer<LineGeometryData, number, LineCoordinate, TopologyLayerData<LineCoordinate>, PathLayer<TopologyLayerData<LineCoordinate>>> {
    constructor(config: VisualizerContext);
    get topologyGetter(): LineTopologyGetter;
    getLayer(timestamp: number): PathLayer<TopologyLayerData<import("@/types").CoordinateArray>, import("@deck.gl/layers").PathLayerProps<TopologyLayerData<import("@/types").CoordinateArray>>>;
}
export declare class TapefilePolygonVisualizer extends TapefileVisualizer<PolygonGeometryData, number, PolygonCoordinate, TopologyLayerData<PolygonCoordinate>, PolygonLayer<TopologyLayerData<PolygonCoordinate>>> {
    constructor(config: VisualizerContext);
    get topologyGetter(): PolygonTopologyGetter;
    getFillColor(obj: TopologyLayerData<LineCoordinate>): [number, number, number, number];
    getLayer(timestamp: number): PolygonLayer<TopologyLayerData<import("@/types").CoordinateArray>, import("@deck.gl/layers").PolygonLayerProps<TopologyLayerData<import("@/types").CoordinateArray>>>;
}
