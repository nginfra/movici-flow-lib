import { expandColorMap } from "@movici-flow-common/visualizers/layers/GridLayer";
import { describe, it, expect } from "vitest";

type colorMap = [number, [number, number, number]][];
describe("expandColorMap", () => {
  it("throws on too small array size", () => {
    expect(() => expandColorMap([])).toThrow();
    expect(() => expandColorMap([[0, [1, 2, 3]]])).toThrow();
  });
  it("expands to 50 steps by default", () => {
    const cm: colorMap = [
      [0, [1, 0, 0]],
      [1, [0, 1, 0]],
      [2, [0, 0, 1]],
    ];
    expect(expandColorMap(cm).length).toStrictEqual(50);
  });
  it("returns already linear color map unmodified", () => {
    const cm: colorMap = [
      [0, [1, 0, 0]],
      [1, [0, 1, 0]],
      [2, [0, 0, 1]],
    ];
    expect(expandColorMap(cm, 3)).toStrictEqual(cm);
  });
  it("expands simple color map", () => {
    const cm: colorMap = [
      [0, [1, 0, 0]],
      [1, [0, 1, 0]],
      [3, [0, 0, 1]],
    ];
    expect(expandColorMap(cm, 4)).toStrictEqual([
      [0, [1, 0, 0]],
      [1, [0, 1, 0]],
      [2, [0, 1, 0]],
      [3, [0, 0, 1]],
    ]);
  });
  it("expands non divisible steps", () => {
    const cm: colorMap = [
      [0.0, [1, 0, 0]],
      [0.2, [0, 1, 0]],
      [0.5, [0, 0, 1]],
    ];

    expect(
      expandColorMap(cm, 6).map((r) => {
        return [Math.round(r[0] * 10) / 10, r[1]];
      })
    ).toStrictEqual([
      [0.0, [1, 0, 0]],
      [0.1, [1, 0, 0]],
      [0.2, [0, 1, 0]],
      [0.3, [0, 1, 0]],
      [0.4, [0, 1, 0]],
      [0.5, [0, 0, 1]],
    ]);
  });
});
