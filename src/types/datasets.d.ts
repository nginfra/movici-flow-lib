import { Line3DCoordinate, LineCoordinate, PolygonCoordinate } from '@/types/geometry';
import { UUID } from '@/types/general';
export interface DatasetCollection {
    datasets: Dataset[];
}
export declare class Dataset {
    name: string;
    display_name: string;
    uuid: UUID;
    type: string;
    has_data: boolean;
    created_on?: number;
    last_modified?: number;
    status: string;
    constructor(config?: Partial<Dataset>);
}
export interface Update {
    created_on: number;
    dataset_uuid: UUID;
    scenario_uuid: UUID;
    iteration: number;
    model_name: string;
    model_type: string;
    name: string;
    timestamp: number;
    type: string;
    uuid: UUID;
}
export interface UpdateWithData<T = any> extends Update {
    data: DatasetData<T>;
}
export interface EntityUpdate<T> {
    timestamp: number;
    iteration: number;
    data: EntityGroupData<T>;
}
export declare class DatasetWithData<T = any> extends Dataset {
    data?: DatasetData<T>;
    constructor(config: Partial<DatasetWithData<T>>);
}
export interface DatasetData<T> {
    [entityGroup: string]: EntityGroupData<T>;
}
interface BaseEntityGroup {
    id: number[];
}
interface EntityGroupProperties<T> {
    [componentProperty: string]: ComponentData<T> | T[];
}
export declare type EntityGroupData<T> = BaseEntityGroup & EntityGroupProperties<T>;
export interface ComponentData<T> {
    [property: string]: T[];
}
interface PointGeometryProperties extends EntityGroupData<number> {
    point_properties: {
        position_x: number[];
        position_y: number[];
    };
}
export declare type PointGeometryData = BaseEntityGroup & PointGeometryProperties;
interface LineGeometryProperties extends EntityGroupProperties<LineCoordinate | Line3DCoordinate> {
    shape_properties: {
        linestring_2d: LineCoordinate[];
        linestring_3d: Line3DCoordinate[];
    };
}
export declare type LineGeometryData = BaseEntityGroup & LineGeometryProperties;
interface PolygonGeometryProperties extends EntityGroupProperties<PolygonCoordinate> {
    shape_properties: {
        polygon: PolygonCoordinate[];
    };
}
export declare type PolygonGeometryData = BaseEntityGroup & PolygonGeometryProperties;
export {};
