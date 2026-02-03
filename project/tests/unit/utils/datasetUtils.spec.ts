import { specialValues } from "@movici-flow-lib/utils/datasetUtils";
import { describe, it, expect } from "vitest";

describe("specialValues", () => {
  it("converts general section", () => {
    expect(
      specialValues({
        special: {
          "some_entities.some.attribute": 12,
        },
      }),
    ).toEqual({
      some_entities: {
        "some.attribute": 12,
      },
    });
  });
  it("support no_data", () => {
    expect(
      specialValues({
        no_data: {
          "some_entities.some.attribute": 12,
        },
      }),
    ).toEqual({
      some_entities: {
        "some.attribute": 12,
      },
    });
  });
});
