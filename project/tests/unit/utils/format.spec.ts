import { formatValueByDataType } from "@movici-flow-lib/utils/format";
import { describe, it, expect } from "vitest";

function rightIndented(text: string, indentation: number) {
  return text + " ".repeat(indentation);
}
describe("formatValueByDataType", () => {
  it.each([
    ["INT", 42, "42"],
    ["FLOAT", 4.2, "4.2"],
    ["DOUBLE", 4.2, "4.2"],
    ["DOUBLE", 0.001, "0.001"],
    ["DOUBLE", 0.0001, "1.000e-4"],
    ["DOUBLE", 420000, "420000"],
    ["DOUBLE", 4200000, "4.200e6"],
    ["BOOLEAN", true, "true"],
    ["BOOLEAN", false, "false"],
    ["LIST<INT>", [], "[ ]"],
    ["LIST<INT>", [1, 2, 3], "[ 1, 2, 3 ]"],
    ["TUPLE<INT, INT>", [1, 2], "[ 1, 2 ]"],
  ])("formats %p with value %p to %p", (dt: string, val: unknown, expected: string) => {
    expect(formatValueByDataType(val, dt)).toEqual(expected);
  });

  it("formats enums", () => {
    expect(
      formatValueByDataType(1, "INT", {
        ENUM: (val: unknown) => {
          return ["a", "b"][Number(val)];
        },
      }),
    ).toEqual("b");
  });

  it("accepts custom formatter", () => {
    const formatters = {
      BOOLEAN: (val: unknown) => (val ? "yes" : "no"),
    };
    expect(formatValueByDataType(true, "BOOLEAN", formatters)).toEqual("yes");
  });

  it("formats lists of enums", () => {
    expect(
      formatValueByDataType([2, 1, 0], "LIST<INT>", {
        ENUM: (val: unknown) => {
          return ["c", "b", "a"][Number(val)];
        },
      }),
    ).toEqual("[ a, b, c ]");
  });

  it("formats nested lists", () => {
    expect(
      formatValueByDataType(
        [
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [5, 5],
        ],
        "LIST<TUPLE<INT,INT>>",
      ),
    ).toEqual(
      [
        rightIndented("[", 20),
        "[ 1, 1 ],",
        "[ 2, 2 ],",
        "[ 3, 3 ],",
        "[ 4, 4 ],",
        "[ 5, 5 ],",
        rightIndented("]", 20),
      ].join("\n"),
    );
  });

  it("truncates long nested lists", () => {
    expect(
      formatValueByDataType(
        [
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [5, 5],
          [6, 6],
        ],
        "LIST<TUPLE<INT,INT>>",
      ),
    ).toEqual(
      [
        rightIndented("[", 20),
        "[ 1, 1 ],",
        "[ 2, 2 ],",
        "[ 3, 3 ],",
        "[ 4, 4 ],",
        rightIndented("...", 13),
        rightIndented("]", 20),
      ].join("\n"),
    );
  });
  it("raises on unsupported data type", () => {
    expect(() =>
      formatValueByDataType([[[]]], "LIST<TUPLE<TUPLE<INT,INT>,TUPLE<INT,INT>>>"),
    ).toThrow("Unsupported data type, too many dimensions");
  });

  it("formats null", () => {
    expect(formatValueByDataType(null, "INT")).toEqual("null");
  });

  it("formats null using custom formatter", () => {
    expect(
      formatValueByDataType(null, "INT", {
        NULL: () => "N/A",
      }),
    ).toEqual("N/A");
  });
});
