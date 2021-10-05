export declare type PointCoordinate = [number, number];
export declare type Point3DCoordinate = [number, number, number];
export declare type CoordinateArray = PointCoordinate[];
export declare type Coordinate3DArray = Point3DCoordinate[];
export declare type LineCoordinate = CoordinateArray;
export declare type Line3DCoordinate = CoordinateArray;
export declare type PolygonCoordinate = CoordinateArray;
export declare type Coordinate = PointCoordinate | LineCoordinate | PolygonCoordinate;
export interface TopologyLayerData<Coord extends Coordinate> {
    id: number;
    idx: number;
    coordinates: Coord;
}
export declare enum EntityGeometry {
    POINT = "points",
    LINE = "lines",
    POLYGON = "polygons"
}
