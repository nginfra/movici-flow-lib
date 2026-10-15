import type { Feature, Geometry, Position } from "geojson";

export type SnapType = "vertex" | "segment" | "endpoint";
export const SNAP_TOLERANCE_PX = 12; // QGIS default

export interface SnapResult {
  position: Position; // [lon, lat], always 2D
  type: SnapType;
}

export interface SnapOptions {
  types: SnapType[];
  tolerancePx: number;
  project: (position: Position) => number[]; // [lon, lat] -> screen [x, y]
  unproject: (pixel: number[]) => number[]; // screen [x, y] -> [lon, lat]
}

type BBox = [number, number, number, number];
type Part = { positions: Position[]; kind: "point" | "line" | "ring" };

// Unchanged features keep their object identity between edits, so this stays valid
const bboxCache = new WeakMap<Feature, BBox>();

function partsOf(geometry: Geometry | null): Part[] {
  switch (geometry?.type) {
    case "Point":
      return [{ positions: [geometry.coordinates], kind: "point" }];
    case "LineString":
      return [{ positions: geometry.coordinates, kind: "line" }];
    case "Polygon":
      return geometry.coordinates.map((ring) => ({ positions: ring, kind: "ring" }));
    default:
      return []; // the geometry bridges only produce the three types above
  }
}

function featureBBox(feature: Feature): BBox {
  let bbox = bboxCache.get(feature);
  if (!bbox) {
    bbox = [Infinity, Infinity, -Infinity, -Infinity];
    for (const { positions } of partsOf(feature.geometry)) {
      for (const position of positions) {
        const x = position[0]!;
        const y = position[1]!;
        if (x < bbox[0]) bbox[0] = x;
        if (y < bbox[1]) bbox[1] = y;
        if (x > bbox[2]) bbox[2] = x;
        if (y > bbox[3]) bbox[3] = y;
      }
    }
    bboxCache.set(feature, bbox);
  }
  return bbox;
}

// Box in [lon, lat] covering the square of screen pixels around the cursor
function searchBBox(
  screen: [number, number],
  tolerancePx: number,
  unproject: SnapOptions["unproject"],
): BBox {
  const [sx, sy] = screen;
  const corners = [
    [sx - tolerancePx, sy - tolerancePx],
    [sx + tolerancePx, sy - tolerancePx],
    [sx - tolerancePx, sy + tolerancePx],
    [sx + tolerancePx, sy + tolerancePx],
  ].map((pixel) => unproject(pixel));
  const xs = corners.map((c) => c[0]!);
  const ys = corners.map((c) => c[1]!);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function intersects(a: BBox, b: BBox): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function samePosition(a: Position | undefined, b: Position | undefined): boolean {
  return !!a && !!b && a[0] === b[0] && a[1] === b[1];
}

function distance2(a: number[], b: number[]): number {
  const dx = a[0]! - b[0]!;
  const dy = a[1]! - b[1]!;
  return dx * dx + dy * dy;
}

function closestPointOnSegment(p: number[], a: number[], b: number[]): number[] {
  const dx = b[0]! - a[0]!;
  const dy = b[1]! - a[1]!;
  const len2 = dx * dx + dy * dy;
  const t =
    len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0]! - a[0]!) * dx + (p[1]! - a[1]!) * dy) / len2));
  return [a[0]! + t * dx, a[1]! + t * dy];
}

/**
 * Finds the position to snap to for a cursor at `screen` (pixels), or null when no target is
 * within `tolerancePx`. Vertices and endpoints win over segments: a segment passes through its
 * own vertices, so it is never further away and would otherwise always win.
 */
export function findSnap(
  screen: [number, number],
  targets: Feature[],
  { types, tolerancePx, project, unproject }: SnapOptions,
): SnapResult | null {
  if (!types.length || !targets.length) return null;
  const snapVertex = types.includes("vertex");
  const snapEndpoint = types.includes("endpoint");
  const snapSegment = types.includes("segment");
  const maxDist2 = tolerancePx * tolerancePx;
  const box = searchBBox(screen, tolerancePx, unproject);

  let bestPoint: { dist2: number; position: Position; type: SnapType } | null = null;
  let bestSegment: { dist2: number; pixel: number[] } | null = null;

  const trySegment = (a: number[], b: number[]) => {
    const pixel = closestPointOnSegment(screen, a, b);
    const dist2 = distance2(pixel, screen);
    if (dist2 <= maxDist2 && (!bestSegment || dist2 < bestSegment.dist2)) {
      bestSegment = { dist2, pixel };
    }
  };

  for (const feature of targets) {
    if (!intersects(featureBBox(feature), box)) continue;
    for (const { positions, kind } of partsOf(feature.geometry)) {
      // Arrow function on purpose: map() also passes (index, array), which would reach
      // viewport.project as its options argument
      const pixels = positions.map((p) => project(p));
      // Stored rings are not always closed; only skip the closing duplicate when there is one
      const closed = kind === "ring" && samePosition(positions[0], positions.at(-1));
      const last = closed ? positions.length - 2 : positions.length - 1;

      for (let i = 0; i <= last; i++) {
        const isEnd = kind === "line" && (i === 0 || i === last);
        const type: SnapType | null =
          isEnd && snapEndpoint ? "endpoint" : snapVertex ? "vertex" : null;
        if (!type) continue;
        const dist2 = distance2(pixels[i]!, screen);
        if (dist2 <= maxDist2 && (!bestPoint || dist2 < bestPoint.dist2)) {
          bestPoint = { dist2, position: positions[i]!, type };
        }
      }

      if (kind !== "point" && snapSegment) {
        for (let i = 0; i < pixels.length - 1; i++) {
          trySegment(pixels[i]!, pixels[i + 1]!);
        }
        if (kind === "ring" && !closed && pixels.length > 2) {
          trySegment(pixels[pixels.length - 1]!, pixels[0]!);
        }
      }
    }
  }

  const point = bestPoint as { position: Position; type: SnapType } | null;
  // bestSegment is only assigned inside trySegment, so TS narrows it to null; widen it back
  const segment = bestSegment as { pixel: number[] } | null;
  if (point) return { position: [point.position[0]!, point.position[1]!], type: point.type };
  if (segment) {
    const [x, y] = unproject(segment.pixel);
    return { position: [x!, y!], type: "segment" };
  }
  return null;
}
