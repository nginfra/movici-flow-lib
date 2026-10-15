import { findSnap, type SnapOptions, type SnapType } from "@movici-flow-lib/utils/snapping";
import type { Feature, Geometry, Position } from "geojson";
import { describe, expect, it, vi } from "vitest";

const identity = (p: number[]) => p;

function feature(geometry: Geometry): Feature {
  return { type: "Feature", geometry, properties: {} };
}
function point(coordinates: Position) {
  return feature({ type: "Point", coordinates });
}
function line(coordinates: Position[]) {
  return feature({ type: "LineString", coordinates });
}
function polygon(ring: Position[]) {
  return feature({ type: "Polygon", coordinates: [ring] });
}

function snap(
  screen: [number, number],
  targets: Feature[],
  types: SnapType[],
  overrides: Partial<SnapOptions> = {},
) {
  return findSnap(screen, targets, {
    types,
    tolerancePx: 1,
    project: identity,
    unproject: identity,
    ...overrides,
  });
}

describe("findSnap", () => {
  const straightLine = line([
    [0, 0],
    [10, 0],
    [20, 0],
  ]);

  it("returns null without snap types", () => {
    expect(snap([0, 0], [point([0, 0])], [])).toBeNull();
  });

  it("returns null without targets", () => {
    expect(snap([0, 0], [], ["vertex"])).toBeNull();
  });

  it("returns null when nothing is within tolerance", () => {
    expect(snap([5, 5], [straightLine], ["vertex", "segment", "endpoint"])).toBeNull();
  });

  describe("point features", () => {
    it("snaps to a point with vertex snapping", () => {
      expect(snap([0.5, 0], [point([0, 0])], ["vertex"])).toEqual({
        position: [0, 0],
        type: "vertex",
      });
    });

    it.each([["endpoint"], ["segment"]] as SnapType[][])("ignores points with %s only", (type) => {
      expect(snap([0.5, 0], [point([0, 0])], [type])).toBeNull();
    });
  });

  describe("line features", () => {
    it("snaps to an interior vertex", () => {
      expect(snap([10, 0.5], [straightLine], ["vertex"])).toEqual({
        position: [10, 0],
        type: "vertex",
      });
    });

    it("does not snap to an interior vertex with endpoint only", () => {
      expect(snap([10, 0.5], [straightLine], ["endpoint"])).toBeNull();
    });

    it("snaps to a line end with endpoint only", () => {
      expect(snap([20.5, 0], [straightLine], ["endpoint"])).toEqual({
        position: [20, 0],
        type: "endpoint",
      });
    });

    it("reports a line end as endpoint when vertex is enabled too", () => {
      expect(snap([0, 0.5], [straightLine], ["vertex", "endpoint"])).toEqual({
        position: [0, 0],
        type: "endpoint",
      });
    });

    it("snaps to the closest point on a segment", () => {
      expect(snap([5, 0.5], [straightLine], ["segment"])).toEqual({
        position: [5, 0],
        type: "segment",
      });
    });

    it("clamps the segment projection to the segment ends", () => {
      expect(snap([25, 0], [straightLine], ["segment"])).toBeNull();
    });

    it("prefers a vertex over a closer segment point", () => {
      expect(snap([10.5, 0.2], [straightLine], ["vertex", "segment"])).toEqual({
        position: [10, 0],
        type: "vertex",
      });
    });
  });

  describe("polygon features", () => {
    const closedSquare = polygon([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ]);
    const openSquare = polygon([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);

    it("snaps to a corner", () => {
      expect(snap([10.5, 10], [closedSquare], ["vertex"])).toEqual({
        position: [10, 10],
        type: "vertex",
      });
    });

    it("snaps to an edge", () => {
      expect(snap([5, 10.5], [closedSquare], ["segment"])).toEqual({
        position: [5, 10],
        type: "segment",
      });
    });

    it("has no endpoints", () => {
      expect(snap([0, 0.5], [closedSquare], ["endpoint"])).toBeNull();
    });

    it("snaps to the closing edge of an open ring", () => {
      expect(snap([0.5, 5], [openSquare], ["segment"])).toEqual({
        position: [0, 5],
        type: "segment",
      });
    });

    it("keeps the last vertex of an open ring", () => {
      expect(snap([0, 10.5], [openSquare], ["vertex"])).toEqual({
        position: [0, 10],
        type: "vertex",
      });
    });
  });

  it("returns the nearest of several candidates", () => {
    const targets = [point([0, 0]), point([0.5, 0])];
    expect(snap([0.6, 0], targets, ["vertex"])).toEqual({ position: [0.5, 0], type: "vertex" });
  });

  it("returns a 2D position for 3D input", () => {
    const result = snap(
      [10, 0.5],
      [
        line([
          [0, 0, 5],
          [10, 0, 5],
        ]),
      ],
      ["vertex"],
    );
    expect(result?.position).toEqual([10, 0]);
  });

  it("does not project features outside the search box", () => {
    const farCoord = [100, 100];
    const project = vi.fn(identity);
    snap([0, 0], [point([0, 0]), point(farCoord)], ["vertex"], { project });
    const projected = project.mock.calls.map(([p]) => p);
    expect(projected).toContainEqual([0, 0]);
    expect(projected).not.toContainEqual(farCoord);
  });

  it("measures the tolerance in screen pixels", () => {
    // 1 world unit = 10 px: a point 0.5 world units away is 5 px away
    const project = (p: number[]) => [p[0]! * 10, p[1]! * 10];
    const unproject = (p: number[]) => [p[0]! / 10, p[1]! / 10];
    const target = [point([0.5, 0])];
    expect(snap([0, 0], target, ["vertex"], { project, unproject, tolerancePx: 4 })).toBeNull();
    expect(snap([0, 0], target, ["vertex"], { project, unproject, tolerancePx: 6 })).toEqual({
      position: [0.5, 0],
      type: "vertex",
    });
  });
});
