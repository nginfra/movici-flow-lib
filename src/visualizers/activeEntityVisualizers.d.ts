/// <reference types="deck.gl" />
import { Coordinate, PointCoordinate, PointGeometryData, TopologyLayerData } from '@/types';
import { ScatterplotLayer } from '@deck.gl/layers';
import { PointTopologyFromStateGetter } from '@/visualizers/geometry';
import { SinglePropertyTapefile } from '@/visualizers/tapefile';
import { BaseVisualizer } from '@/visualizers/visualizers';
interface ActiveEntityLayerData<Coord extends Coordinate> extends TopologyLayerData<Coord> {
    onHoverText?: string | number;
}
export declare class ActivePointVisualizer extends BaseVisualizer<PointGeometryData, PointCoordinate, ActiveEntityLayerData<PointCoordinate>, ScatterplotLayer<ActiveEntityLayerData<PointCoordinate>>> {
    toggleData?: SinglePropertyTapefile<boolean>;
    onHoverData?: SinglePropertyTapefile<string | number>;
    topology?: ActiveEntityLayerData<PointCoordinate>[];
    get topologyGetter(): PointTopologyFromStateGetter;
    doLoad(): Promise<void>;
    getDataForTimestamp(timestamp: number): ActiveEntityLayerData<PointCoordinate>[];
    getLayer(timestamp: number): ScatterplotLayer<ActiveEntityLayerData<PointCoordinate>, import("@deck.gl/layers").ScatterplotLayerProps<ActiveEntityLayerData<PointCoordinate>>>;
}
export {};
