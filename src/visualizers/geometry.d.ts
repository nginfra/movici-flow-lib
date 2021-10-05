import { ComponentProperty, Coordinate, EntityGroupData, EntityGroupSummary, LineCoordinate, LineGeometryData, PointCoordinate, PointGeometryData, PolygonCoordinate, PolygonGeometryData, PropertyType, TopologyLayerData } from '@/types';
import { EntityGeometry } from '@/types/geometry';
import { DatasetDownloader } from '@//utils/DatasetDownloader';
/**
 * A `TopologyGetter` queries a DatasetStore for topology information of a certain entity group,
 * (ie. for point data, line data or polygon data) and converts that data into topology objects
 * `TopologyLayerData` which are used for the `data` prop of deck.gl `Layers`
 * @param store: a `DatasetStore` configured for the required dataset
 * @param entity: an entity group name
 */
export declare abstract class TopologyGetter<Data extends EntityGroupData<any>, Coord extends Coordinate> {
    protected store: DatasetDownloader;
    protected entity: string;
    abstract props: ComponentProperty[];
    constructor(store: DatasetDownloader, entity: string);
    abstract getTopology(): Promise<TopologyLayerData<Coord>[]>;
    protected abstract getCoordinate(data: Data, i: number): Coord | null;
    protected getTopologyFromEntityData(data: Data): TopologyLayerData<Coord>[];
}
export declare class PointTopologyGetter extends TopologyGetter<PointGeometryData, PointCoordinate> {
    props: ComponentProperty[];
    getTopology(): Promise<TopologyLayerData<PointCoordinate>[]>;
    getCoordinate(data: PointGeometryData, i: number): PointCoordinate | null;
}
export declare class LineTopologyGetter extends TopologyGetter<LineGeometryData, LineCoordinate> {
    props: ComponentProperty[];
    getTopology(): Promise<TopologyLayerData<import("@/types").CoordinateArray>[]>;
    getCoordinate(data: LineGeometryData, i: number): import("@/types").CoordinateArray | null;
}
export declare class PolygonTopologyGetter extends TopologyGetter<PolygonGeometryData, PolygonCoordinate> {
    props: ComponentProperty[];
    getTopology(): Promise<TopologyLayerData<import("@/types").CoordinateArray>[]>;
    getCoordinate(data: PolygonGeometryData, i: number): import("@/types").CoordinateArray | null;
}
/**
 * The default TopologyGetters download their topology from the initial data. This topology getter
 * downloads it's topology from a scenario state. For this to work, the `DatasetStore` must be
 * configured with a scenario uuid. The requested state is the end state of the scenario.
 */
export declare class PointTopologyFromStateGetter extends TopologyGetter<PointGeometryData, PointCoordinate> {
    props: ComponentProperty[];
    getTopology(): Promise<TopologyLayerData<PointCoordinate>[]>;
    getCoordinate(data: PointGeometryData, i: number): PointCoordinate | null;
}
export declare function determineEntityGeometry(summary: EntityGroupSummary): EntityGeometry | null;
export declare function isPoints(properties: PropertyType[]): boolean;
export declare function isLines(properties: PropertyType[]): boolean;
export declare function isPolygons(properties: PropertyType[]): boolean;
