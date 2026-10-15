import type { Feature, Position } from "geojson";

function pointInRing(x: number, y: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!;
    const yi = ring[i]![1]!;
    const xj = ring[j]![0]!;
    const yj = ring[j]![1]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function* positionsOf(coordinates: unknown): Generator<Position> {
  if (!Array.isArray(coordinates)) return;
  if (typeof coordinates[0] === "number") {
    yield coordinates as Position;
    return;
  }
  for (const child of coordinates) yield* positionsOf(child);
}

export function featuresInPolygon(features: Feature[], ring: Position[]): Feature[] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const position of ring) {
    const x = position[0]!;
    const y = position[1]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const matched: Feature[] = [];
  for (const feature of features) {
    // Geometry collections are excluded given that
    // selection tools are apply per entity group
    const geometry = feature.geometry;
    if (!geometry || geometry.type === "GeometryCollection") continue;
    for (const position of positionsOf(geometry?.coordinates)) {
      const x = position[0]!;
      const y = position[1]!;
      // low cost bbox check, avoids high cost check
      if (x < minX || x > maxX || y < minY || y > maxY) continue;
      if (pointInRing(x, y, ring)) {
        matched.push(feature);
        break;
      }
    }
  }
  return matched;
}
