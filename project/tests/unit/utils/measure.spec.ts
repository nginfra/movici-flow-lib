import { setProjections, transformArray } from "@movici-flow-lib/crs";
import type { CoordinateArray } from "@movici-flow-lib/types";
import {
  formatArea,
  formatLength,
  isMetricCRS,
  measureFeature,
  planarArea,
  planarLength,
  planarPerimeter,
} from "@movici-flow-lib/utils/measure";
import type { Feature, Geometry } from "geojson";
import { describe, expect, it } from "vitest";

function feature(geometry: Geometry): Feature {
  return { type: "Feature", geometry, properties: {} };
}

// RD coordinates (EPSG:28992) converted to the WGS84 positions the editor renders
function rdToWgs84(coords: CoordinateArray): CoordinateArray {
  return transformArray(coords, 28992);
}

const UNIT_SQUARE: CoordinateArray = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];
const CLOSED_UNIT_SQUARE: CoordinateArray = [...UNIT_SQUARE, [0, 0]];

describe("planarLength", () => {
  it("measures a single segment", () => {
    expect(
      planarLength([
        [0, 0],
        [3, 4],
      ]),
    ).toBe(5);
  });

  it("sums multiple segments", () => {
    expect(
      planarLength([
        [0, 0],
        [3, 4],
        [3, 10],
      ]),
    ).toBe(11);
  });

  it("is zero for fewer than two points", () => {
    expect(planarLength([[1, 1]])).toBe(0);
    expect(planarLength([])).toBe(0);
  });
});

describe("planarPerimeter", () => {
  it("includes the closing segment of an open ring", () => {
    expect(planarPerimeter(UNIT_SQUARE)).toBe(4);
  });

  it("does not double count the closing segment of a closed ring", () => {
    expect(planarPerimeter(CLOSED_UNIT_SQUARE)).toBe(4);
  });
});

describe("planarArea", () => {
  it("measures open and closed rings", () => {
    expect(planarArea(UNIT_SQUARE)).toBe(1);
    expect(planarArea(CLOSED_UNIT_SQUARE)).toBe(1);
  });

  it("is positive for clockwise rings", () => {
    expect(planarArea([...UNIT_SQUARE].reverse())).toBe(1);
  });

  it("stays precise for large projected coordinates", () => {
    const shifted = UNIT_SQUARE.map(([x, y]) => [x + 155000, y + 463000]) as CoordinateArray;
    expect(planarArea(shifted)).toBe(1);
  });

  it("is zero for degenerate rings", () => {
    expect(
      planarArea([
        [0, 0],
        [1, 1],
      ]),
    ).toBe(0);
  });
});

describe("measureFeature", () => {
  it("measures a polygon in the dataset CRS", () => {
    const ring = rdToWgs84([
      [155000, 463000],
      [155100, 463000],
      [155100, 463100],
      [155000, 463100],
      [155000, 463000],
    ]);
    const result = measureFeature(feature({ type: "Polygon", coordinates: [ring] }), 28992);

    expect(result?.kind).toBe("polygon");
    if (result?.kind !== "polygon") return;
    expect(result.perimeter).toBeCloseTo(400, 3);
    expect(result.area).toBeCloseTo(10000, 3);
  });

  it("subtracts hole areas and includes hole boundaries in the perimeter", () => {
    const outer = rdToWgs84([
      [155000, 463000],
      [155100, 463000],
      [155100, 463100],
      [155000, 463100],
      [155000, 463000],
    ]);
    const hole = rdToWgs84([
      [155020, 463020],
      [155020, 463040],
      [155040, 463040],
      [155040, 463020],
      [155020, 463020],
    ]);
    const result = measureFeature(feature({ type: "Polygon", coordinates: [outer, hole] }), 28992);

    expect(result?.kind).toBe("polygon");
    if (result?.kind !== "polygon") return;
    expect(result.perimeter).toBeCloseTo(480, 3);
    expect(result.area).toBeCloseTo(9600, 3);
  });

  it("measures a line in the dataset CRS", () => {
    const line = rdToWgs84([
      [155000, 463000],
      [155250, 463000],
    ]);
    const result = measureFeature(feature({ type: "LineString", coordinates: line }), 28992);

    expect(result?.kind).toBe("line");
    if (result?.kind !== "line") return;
    expect(result.length).toBeCloseTo(250, 3);
  });

  it("does not measure points", () => {
    expect(measureFeature(feature({ type: "Point", coordinates: [5, 52] }), 28992)).toBeNull();
  });
});

describe("isMetricCRS", () => {
  it("accepts a projected CRS in metres", () => {
    expect(isMetricCRS(28992)).toBe(true);
  });

  it("rejects a geographic CRS", () => {
    expect(isMetricCRS("EPSG:4326")).toBe(false);
  });

  it("accepts a projected CRS without explicit units", () => {
    setProjections({ "TEST:UTM31": "+proj=utm +zone=31 +datum=WGS84" });
    expect(isMetricCRS("TEST:UTM31")).toBe(true);
  });
});

describe("formatting", () => {
  it("formats lengths in metres", () => {
    expect(formatLength(1234.567)).toBe("1,234.57 m");
  });

  it("formats areas in square metres", () => {
    expect(formatArea(10000)).toBe("10,000 m²");
  });
});
