export type PointCoordinate = [number, number];
export type Point3DCoordinate = [number, number, number];
export type CoordinateArray = PointCoordinate[];
export type Coordinate3DArray = Point3DCoordinate[];
export type LineCoordinate = CoordinateArray;
export type Line3DCoordinate = CoordinateArray;
export type PolygonCoordinate = CoordinateArray;

export type Coordinate = PointCoordinate | LineCoordinate | PolygonCoordinate;
export interface TopologyLayerData<Coord extends Coordinate> {
  id: number;
  idx: number;
  coordinates: Coord;
}

export enum EntityGeometry {
  POINT = 'points',
  LINE = 'lines',
  POLYGON = 'polygons'
}
