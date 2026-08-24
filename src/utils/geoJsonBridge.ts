/* An utility to bridge Movici columnar entity data and GeoJSON features for the dataset editor. */

import {
  transform,
  reverseTransform,
  transformArray,
  reverseTransformArray,
  determineCRS,
} from "../crs";
import type { EntityGroupData } from "../types";
import type { Feature, Geometry, Point, LineString, Polygon } from "geojson";

export type { Feature };
export type GeometryType = "point" | "linestring" | "polygon";
export type GeometryData = Record<string, number | number[][]>;

type GroupData = EntityGroupData<any>;

// Candidate geometry columns per type
export const GEOMETRY_COLUMNS: Record<GeometryType, string[]> = {
  point: ["geometry.x", "geometry.y"],
  linestring: ["geometry.linestring_2d", "geometry.linestring_3d"],
  polygon: ["geometry.polygon_3d", "geometry.polygon_2d", "geometry.polygon"],
};

// defaulst for new entity groups
export const DEFAULT_GEOMETRY_COLUMNS: Record<GeometryType, string[]> = {
  point: ["geometry.x", "geometry.y"],
  linestring: ["geometry.linestring_2d"],
  polygon: ["geometry.polygon"],
};

export interface GeometryBridge {
  readonly geometryType: GeometryType;
  readonly geometryKeys: string[];
  getGeometryData(group: GroupData, dataIndex: number): GeometryData;
  featureToGeometryData(feature: Feature): GeometryData;
  geometryDataToGeometry(data: GeometryData): Geometry;
  entityDataToWgs84Features(group: GroupData): Feature[];
  getBounds(group: GroupData): [number, number, number, number] | null; // Bounding box
}

abstract class BaseGeometryBridge implements GeometryBridge {
  abstract readonly geometryType: GeometryType;
  abstract readonly geometryKeys: string[];

  protected readonly crs: string;

  constructor(epsg: number | null) {
    this.crs = determineCRS(epsg);
  }

  abstract getGeometryData(group: GroupData, dataIndex: number): GeometryData;
  abstract featureToGeometryData(feature: Feature): GeometryData;
  abstract geometryDataToGeometry(data: GeometryData): Geometry;

  // Coordinates in dataset CRS used for bbox
  protected abstract coordinatesOf(data: GeometryData): number[][];

  entityDataToWgs84Features(group: GroupData): Feature[] {
    const ids = group.id ?? [];
    const propKeys = Object.keys(group).filter((k) => !this.geometryKeys.includes(k));

    return ids.map((id, dataIndex) => {
      const properties: Record<string, unknown> = { __id: id };
      for (const key of propKeys) {
        properties[key] = group[key]?.[dataIndex];
      }
      return {
        type: "Feature",
        geometry: this.geometryDataToGeometry(this.getGeometryData(group, dataIndex)),
        properties,
      };
    });
  }

  getBounds(group: GroupData): [number, number, number, number] | null {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let found = false;

    const count = group.id?.length ?? 0;
    for (let i = 0; i < count; i++) {
      for (const coord of this.coordinatesOf(this.getGeometryData(group, i))) {
        const x = coord[0];
        const y = coord[1];
        if (x == null || y == null) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
    return found ? [minX, minY, maxX, maxY] : null;
  }
}

export class PointBridge extends BaseGeometryBridge {
  readonly geometryType = "point" as const;
  readonly geometryKeys = ["geometry.x", "geometry.y"];

  getGeometryData(group: GroupData, dataIndex: number): GeometryData {
    return {
      "geometry.x": (group["geometry.x"] as number[])[dataIndex]!,
      "geometry.y": (group["geometry.y"] as number[])[dataIndex]!,
    };
  }

  featureToGeometryData(feature: Feature): GeometryData {
    const lonLat = ((feature.geometry as Point)?.coordinates ?? [0, 0]) as [number, number];
    const [x, y] = reverseTransform(lonLat, this.crs);
    return { "geometry.x": x, "geometry.y": y };
  }

  geometryDataToGeometry(data: GeometryData): Point {
    const x = data["geometry.x"] as number;
    const y = data["geometry.y"] as number;
    return { type: "Point", coordinates: transform([x, y], this.crs) };
  }

  protected coordinatesOf(data: GeometryData): number[][] {
    return [[data["geometry.x"] as number, data["geometry.y"] as number]];
  }
}

export class LineStringBridge extends BaseGeometryBridge {
  readonly geometryType = "linestring" as const;
  readonly geometryKeys: string[];

  constructor(
    private readonly key: string,
    epsg: number | null,
  ) {
    super(epsg);
    this.geometryKeys = [key];
  }

  getGeometryData(group: GroupData, dataIndex: number): GeometryData {
    return { [this.key]: (group[this.key] as number[][][])[dataIndex] ?? [] };
  }

  featureToGeometryData(feature: Feature): GeometryData {
    const coords = ((feature.geometry as LineString)?.coordinates ?? []) as [number, number][];
    return { [this.key]: reverseTransformArray(coords, this.crs) };
  }

  geometryDataToGeometry(data: GeometryData): LineString {
    const line = (data[this.key] ?? []) as [number, number][];
    return { type: "LineString", coordinates: transformArray(line, this.crs) };
  }

  protected coordinatesOf(data: GeometryData): number[][] {
    return (data[this.key] ?? []) as number[][];
  }
}

export class PolygonBridge extends BaseGeometryBridge {
  readonly geometryType = "polygon" as const;
  readonly geometryKeys: string[];

  constructor(
    private readonly key: string,
    epsg: number | null,
  ) {
    super(epsg);
    this.geometryKeys = [key];
  }

  getGeometryData(group: GroupData, dataIndex: number): GeometryData {
    return { [this.key]: (group[this.key] as number[][][])[dataIndex] ?? [] };
  }

  // Only outer ring is kept; holes are dropped
  featureToGeometryData(feature: Feature): GeometryData {
    const rings = ((feature.geometry as Polygon)?.coordinates ?? []) as [number, number][][];
    const outer = rings[0] ?? [];
    return { [this.key]: closeRing(reverseTransformArray(outer, this.crs)) };
  }

  geometryDataToGeometry(data: GeometryData): Polygon {
    const ring = (data[this.key] ?? []) as [number, number][];
    return { type: "Polygon", coordinates: [transformArray(ring, this.crs)] };
  }

  protected coordinatesOf(data: GeometryData): number[][] {
    return (data[this.key] ?? []) as number[][];
  }
}

function closeRing(ring: number[][]): number[][] {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last) return ring;
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

export function createGeometryBridge(group: GroupData, epsg: number | null): GeometryBridge | null {
  if ("geometry.x" in group && "geometry.y" in group) {
    return new PointBridge(epsg);
  }
  const lineKey = GEOMETRY_COLUMNS.linestring.find((k) => k in group);
  if (lineKey) return new LineStringBridge(lineKey, epsg);

  const polygonKey = GEOMETRY_COLUMNS.polygon.find((k) => k in group);
  if (polygonKey) return new PolygonBridge(polygonKey, epsg);

  return null;
}
