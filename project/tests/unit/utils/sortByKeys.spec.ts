import { sortByKeys } from "@movici-flow-lib/utils";
import { describe, it, expect } from "vitest";

const item0 = { id: 0, name: "finn" },
  item1 = { id: 1, name: "finn" },
  item2 = { id: 2, name: "jake" },
  itemNull = { id: 3, name: null };

describe("sortByKeys", () => {
  it("does nothing on an already sorted array", () => {
    const rv = [item0, item1, item2];
    expect(rv.sort(sortByKeys(["id"]))).toEqual(rv);
  });

  it("sorts based on ascending id", () => {
    const rv = [itemNull, item1, item2, item0],
      expected = [item0, item1, item2, itemNull];
    expect(rv.sort(sortByKeys(["id"]))).toEqual(expected);
  });
  it("works with and without + for ascending sorting", () => {
    const rv = [item1, item2, item0, itemNull];
    expect(rv.sort(sortByKeys(["name"]))).toEqual(rv.sort(sortByKeys(["+name"])));
  });

  it("sorts based on descending id", () => {
    const rv = [item0, item1, item2, itemNull],
      expected = [itemNull, item2, item1, item0];
    expect(rv.sort(sortByKeys(["-id"]))).toEqual(expected);
  });

  it("sorts based on ascending name, then on descending id ", () => {
    const rv = [itemNull, item0, item1, item2],
      expected = [item1, item0, item2, itemNull];
    expect(rv.sort(sortByKeys(["name", "-id"]))).toEqual(expected);
  });

  it("throws error if doesnt allow null values", () => {
    const rv = [item0, item1, itemNull];
    expect(() => rv.sort(sortByKeys(["name"], false))).toThrow(Error);
  });

  it(`throws error if key doesn't exist and doesnt allow null values`, () => {
    const rv = [item0, item1, itemNull];
    expect(() => rv.sort(sortByKeys(["order"], false))).toThrow(Error);
  });
});
