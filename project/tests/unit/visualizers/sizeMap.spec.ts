import { NumberSizeMap } from "@movici-flow-common/visualizers/maps/sizeMaps";
import { describe, it, expect } from "vitest";

const mapping = new NumberSizeMap({
  sizes: [
    [0, 0],
    [100, 10],
  ],
});

describe("sizeMaps.ts/NumberSizeMap", () => {
  it("returns a size for a number", () => {
    expect(mapping.getValue(100)).toStrictEqual(10);
  });

  it("returns a size for a number below min", () => {
    expect(mapping.getValue(-1)).toStrictEqual(0);
  });

  it("returns a size for a number above max", () => {
    expect(mapping.getValue(101)).toStrictEqual(10);
  });

  it("returns a size for an in-between number", () => {
    expect(mapping.getValue(4.284)).toStrictEqual(0.4284);
  });

  it("returns a size for nan value", () => {
    expect(mapping.getValue(NaN)).toStrictEqual(0);
  });

  it("returns a size for null value", () => {
    expect(mapping.getValue(null)).toStrictEqual(0);
  });

  it("works with nonzero offset", () => {
    expect(
      new NumberSizeMap({
        sizes: [
          [1, 2],
          [2, 3],
        ],
      }).getValue(1.5)
    ).toStrictEqual(2.5);
  });

  // calculateThickness acts strange for negative values
  it("returns a positive size for negative value", () => {
    expect(
      new NumberSizeMap({
        sizes: [
          [-2, 1],
          [-1, 2],
        ],
      }).getValue(-1.5)
    ).toStrictEqual(1.5);
  });
  it("returns the right size for decreasing sizes", () => {
    expect(
      new NumberSizeMap({
        sizes: [
          [-2, 2],
          [-1, 1],
        ],
      }).getValue(-1.5)
    ).toStrictEqual(1.5);
  });
});
