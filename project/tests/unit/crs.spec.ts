/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { transform, transformArray, transformGeoJsonToCRS } from "@movici-flow-lib/crs";
import { ValidationError } from "@movici-flow-lib/errors";
import { describe, expect, it } from "vitest";

describe("crs.ts", () => {
  const geojson = {
    coordinates: [
      [
        [4.3, 52.0],
        [4.4, 52.0],
        [4.3, 52.1],
        [4.3, 52.0],
      ],
    ],
    type: "Polygon",
  };
  const input_crs = [
    [undefined, "without crs specifier"],
    [{ properties: { name: "WGS84" }, type: "name" }, "with name specifier"],
    [{ properties: { code: 4326 }, type: "EPSG" }, "with code specifier"],
  ];
  input_crs.forEach(([crs, testCase]) => {
    it(`can transform geojson ${testCase} to epsg28992`, () => {
      const input = { ...geojson, crs };
      const result = transformGeoJsonToCRS(input);

      result.coordinates[0] = result.coordinates[0].map((pair) => {
        const [x, y] = pair;
        return [Math.floor(x), Math.floor(y)];
      });
      expect(result).toStrictEqual({
        coordinates: [
          [
            [80341, 446294],
            [87208, 446196],
            [80508, 457419],
            [80341, 446294],
          ],
        ],
        type: "Polygon",
        crs: { properties: { name: "EPSG:28992" }, type: "name" },
      });
    });
  });
  it(`throws on an unsupported crs`, () => {
    const crs = {
      type: "EPSG",
      properties: {
        code: 0,
      },
    };
    const input = { ...geojson, crs };

    expect(() => transformGeoJsonToCRS(input)).toThrow(
      new ValidationError('Unsupported CRS: {"type":"EPSG","properties":{"code":0}}'),
    );
  });
  it("transforms a point to WGS-84", () => {
    const transformed = transform([80341, 446294]);
    const rounded = transformed.map((n) => {
      return Math.round(n * 10) / 10;
    });
    expect(rounded).toStrictEqual([4.3, 52.0]);
  });
  it("transforms an array to WGS-84", () => {
    const transformed = transformArray([[80341, 446294]]);
    const rounded = transformed.map(([x, y]) => {
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    });
    expect(rounded).toStrictEqual([[4.3, 52.0]]);
  });
});
