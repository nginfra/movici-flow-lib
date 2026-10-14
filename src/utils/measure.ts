import proj4 from "proj4";
import type { Feature } from "geojson";
import { determineCRS, reverseTransformArray } from "../crs";
import type { CoordinateArray } from "../types";

export type Measurement =
  | { kind: "line"; length: number }
  | { kind: "polygon"; perimeter: number; area: number };

const METRE_UNITS = ["m", "meter", "metre"];

// True when the CRS is projected and uses metres
export function isMetricCRS(crs?: string | number | null): boolean {
  const def = proj4.defs(determineCRS(crs));
  if (!def || def.projName === "longlat") return false;
  // proj4 assumes metres for projected CRSs without an explicit unit
  return def.units === undefined || METRE_UNITS.includes(def.units);
}

export function planarLength(coords: CoordinateArray): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1]!;
    const [x1, y1] = coords[i]!;
    total += Math.hypot(x1 - x0, y1 - y0);
  }
  return total;
}

export function planarPerimeter(ring: CoordinateArray): number {
  if (ring.length < 2) return 0;
  return planarLength([...ring, ring[0]!]);
}

// Uses the Shoelace formula
export function planarArea(ring: CoordinateArray): number {
  if (ring.length < 3) return 0;
  const [ox, oy] = ring[0]!;
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, y0] = ring[i]!;
    const [x1, y1] = ring[(i + 1) % ring.length]!;
    sum += (x0 - ox) * (y1 - oy) - (x1 - ox) * (y0 - oy);
  }
  return Math.abs(sum) / 2;
}

// Measures a WGS84 GeoJSON feature in the given (projected, metric) CRS.
export function measureFeature(feature: Feature, crs?: string | number | null): Measurement | null {
  const geometry = feature.geometry;
  if (geometry?.type === "LineString") {
    const coords = reverseTransformArray(geometry.coordinates as CoordinateArray, crs);
    return { kind: "line", length: planarLength(coords) };
  }
  if (geometry?.type === "Polygon") {
    const rings = geometry.coordinates.map((ring) =>
      reverseTransformArray(ring as CoordinateArray, crs),
    );
    const perimeter = rings.reduce((total, ring) => total + planarPerimeter(ring), 0);
    const area = rings.reduce(
      (total, ring, index) => total + (index === 0 ? 1 : -1) * planarArea(ring),
      0,
    );
    return { kind: "polygon", perimeter, area };
  }
  return null;
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatLength(metres: number): string {
  return `${NUMBER_FORMAT.format(metres)} m`;
}

export function formatArea(squareMetres: number): string {
  return `${NUMBER_FORMAT.format(squareMetres)} m²`;
}
