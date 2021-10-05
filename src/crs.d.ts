import { Coordinate3DArray, CoordinateArray, Point3DCoordinate, PointCoordinate } from '@/types';
declare type GeoJSON = any;
export declare function transform(coord: PointCoordinate | Point3DCoordinate): PointCoordinate;
export declare function reverseTransform(coord: PointCoordinate | Point3DCoordinate): PointCoordinate;
export declare function transformArray(arr: CoordinateArray | Coordinate3DArray): CoordinateArray;
export declare function transformGeoJsonToCRS(geojson: GeoJSON, targetCRS?: string): any;
export {};
