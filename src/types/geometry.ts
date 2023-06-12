export type PointCoordinate = [number, number];
export type Point3DCoordinate = [number, number, number];
export type CoordinateArray = PointCoordinate[];
export type Coordinate3DArray = Point3DCoordinate[];
export type LineCoordinate = CoordinateArray;
export type Line3DCoordinate = Coordinate3DArray;
export type PolygonCoordinate = CoordinateArray | Coordinate3DArray;
export type GridCellPoints = number[];

export type Coordinate = PointCoordinate | LineCoordinate | PolygonCoordinate;
export interface TopologyLayerData<Coord extends Coordinate | unknown> {
  id: number;
  idx: number;
  coordinates: Coord;
}

export enum EntityGeometry {
  POINT = "points",
  LINE = "lines",
  POLYGON = "polygons",
  GRID = "grid",
}

export interface ITopologyGetter<Coord extends Coordinate> {
  getTopology(): Promise<TopologyLayerData<Coord>[]>;
}
/**
 * A `TopologyGetter` queries a DatasetStore for topology information of a certain entity group,
 * (ie. for point data, line data or polygon data) and converts that data into topology objects
 * `TopologyLayerData` which are used for the `data` prop of deck.gl `Layers`
 * @param store: a `DatasetStore` configured for the required dataset
 * @param entity: an entity group name
 */
