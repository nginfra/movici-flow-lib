import {
  createValueMappingHelper,
  ContinuousValueMappingHelper,
  type ValueMapping,
  BucketValueMappingHelper,
  BooleanValueMappingHelper,
  EnumValueMappingHelper,
  ValueMappingHelper,
  recalculateMappingValues,
  interpolateMinMax,
  type RecalculateMappingValueParams,
  MappingStrategy,
} from "@movici-flow-lib/components/visualizerConfigurator/ValueMappingHelper";
import { describe, it, expect, beforeEach } from "vitest";
class DummyStrategy extends MappingStrategy<number> {
  nSteps: number;
  output: number;
  interpolateOutput: boolean;

  constructor(params?: { nSteps?: number; output?: number; interpolateOutput?: boolean }) {
    super();
    this.nSteps = params?.nSteps ?? 2;
    this.output = params?.output ?? 0;
    this.interpolateOutput = params?.interpolateOutput ?? true;
  }
  doRecalculateOutputs(outputs: number[], nSteps: number): number[] {
    const first = outputs[0] ?? this.defaultOutput();
    const last = outputs[outputs.length - 1] ?? this.defaultOutput();
    return interpolateMinMax(first, last, nSteps, true);
  }

  defaultStepCount(): number {
    return this.nSteps;
  }

  defaultOutput(): number {
    return this.output;
  }
}

describe("ContinuousValueMappingHelper", () => {
  let helper: ValueMappingHelper<number>;
  beforeEach(() => {
    helper = new ContinuousValueMappingHelper({
      summary: {
        name: "attribute",
        data_type: "DOUBLE",
        min_val: 0,
        max_val: 1,
      },
      strategy: new DummyStrategy(),
    });
  });

  it("resets min and max", () => {
    expect(
      helper.resetMinMax([
        [1, 3],
        [10, 4],
      ])
    ).toStrictEqual([
      [0, 3],
      [1, 4],
    ]);
  });

  it("linearizes between min and max", () => {
    expect(
      helper.linearizeValues([
        [1, 3],
        [2.5, 4],
        [3, 5],
      ])
    ).toStrictEqual([
      [1, 3],
      [2, 4],
      [3, 5],
    ]);
  });

  it("increases steps", () => {
    expect(
      helper.updateSteps(
        [
          [1, 3],
          [3, 5],
        ],
        3
      )
    ).toStrictEqual([
      [1, 3],
      [2, 4],
      [3, 5],
    ]);
  });

  it("decreases steps", () => {
    expect(
      helper.updateSteps(
        [
          [1, 3],
          [2, 4],
          [3, 5],
        ],
        2
      )
    ).toStrictEqual([
      [1, 3],
      [3, 5],
    ]);
  });

  it.each([
    [
      "from mapping",
      {
        mapping: [
          [10, 1],
          [11, 1],
        ],
        readFromSummary: false,
        expected: [10, 11],
      },
    ],
    [
      "from a single length mapping",
      {
        mapping: [[2, 2]],
        readFromSummary: false,
        expected: [2, 2],
      },
    ],
    [
      "forced",
      {
        mapping: [
          [10, 1],
          [11, 1],
        ],
        readFromSummary: true,
        expected: [0, 1],
      },
    ],

    [
      "for empty mapping",
      {
        mapping: [],
        readFromSummary: false,
        expected: [0, 1],
      },
    ],
    [
      "when values not found",
      {
        mapping: [],
        summaryMin: null,
        summaryMax: null,
        readFromSummary: false,
        expected: [0, 0],
      },
    ],
    [
      "when forceReset but values not in summary",
      {
        mapping: [
          [3, 2],
          [4, 2],
        ],
        summaryMin: null,
        summaryMax: null,
        readFromSummary: true,
        expected: [3, 4],
      },
    ],
  ])(
    "calculates min max %s",
    (
      _: string,
      params: {
        mapping: number[][];
        summaryMin?: number | null;
        summaryMax?: number | null;
        readFromSummary?: boolean;
        expected: number[];
      }
    ) => {
      const helper = new ContinuousValueMappingHelper({
        summary: {
          name: "attribute",
          data_type: "DOUBLE",
          min_val: params?.summaryMin !== undefined ? params.summaryMin : 0,
          max_val: params?.summaryMax !== undefined ? params.summaryMax : 1,
        },
        strategy: new DummyStrategy(),
      });
      expect(
        helper.getMinMax(params.mapping as ValueMapping<number>, params.readFromSummary)
      ).toStrictEqual(params.expected);
    }
  );
  it.each([
    [
      "from mapping",
      {
        mapping: [
          [10, 1],
          [11, 1],
        ],
        expected: [
          [10, 1],
          [11, 1],
        ],
      },
    ],

    [
      "from empty mapping",
      {
        mapping: [],
        expected: [
          [0, 0],
          [0.5, 0],
          [1, 0],
        ],
      },
    ],
    [
      "from a too small mapping",
      {
        mapping: [[0, 1]],
        expected: [
          [0, 1],
          [0.5, 1],
          [1, 1],
        ],
      },
    ],
    [
      "with reset min max",
      {
        mapping: [
          [10, 1],
          [11, 1],
        ],
        resetMinMax: true,
        expected: [
          [0, 1],
          [1, 1],
        ],
      },
    ],
  ])(
    "initializes %s",
    (
      _: string,
      params: {
        mapping: number[][];
        resetMinMax?: boolean;
        expected: number[][];
      }
    ) => {
      const helper = new ContinuousValueMappingHelper({
        summary: {
          name: "attribute",
          data_type: "DOUBLE",
          min_val: 0,
          max_val: 1,
        },
        strategy: new DummyStrategy({ nSteps: 3 }),
      });
      expect(
        helper.initializeMapping(params.mapping as ValueMapping<number>, {
          resetMinMax: params.resetMinMax,
        })
      ).toStrictEqual(params.expected);
    }
  );
  it("initializes with overridden maxValue", () => {
    const helper = new ContinuousValueMappingHelper({
      summary: {
        name: "attribute",
        data_type: "DOUBLE",
        min_val: 0,
        max_val: 1,
      },
      strategy: new DummyStrategy({ nSteps: 3 }),
    });
    expect(
      helper.initializeMapping(
        [
          [0, 0],
          [1, 0],
        ],
        {
          overrideMax: 10,
        }
      )
    ).toStrictEqual([
      [0, 0],
      [10, 0],
    ]);
  });
});

describe("BucketValueMappingHelper", () => {
  let helper: ValueMappingHelper<number>;
  beforeEach(() => {
    helper = new BucketValueMappingHelper({
      summary: {
        name: "attribute",
        data_type: "DOUBLE",
        min_val: 0,
        max_val: 1,
      },
      strategy: new DummyStrategy(),
    });
  });
  it("resets min and max", () => {
    expect(
      helper.resetMinMax([
        [1, 3],
        [10, 4],
      ])
    ).toStrictEqual([
      [0, 3],
      [0.5, 4],
    ]);
  });
  it("resets stored max value upon reset", () => {
    helper.setMaxValue(10);
    helper.resetMinMax([
      [1, 3],
      [10, 4],
    ]);
    expect(
      helper.linearizeValues([
        [0, 3],
        [1, 4],
      ])
    ).toStrictEqual([
      [0, 3],
      [0.5, 4],
    ]);
  });
  it("linearizes between min and max", () => {
    helper.setMaxValue(3);
    expect(
      helper.linearizeValues([
        [1, 3],
        [2.5, 4],
      ])
    ).toStrictEqual([
      [1, 3],
      [2, 4],
    ]);
  });

  it("increases steps", () => {
    helper.setMaxValue(4);

    expect(
      helper.updateSteps(
        [
          [1, 3],
          [3, 5],
        ],
        3
      )
    ).toStrictEqual([
      [1, 3],
      [2, 4],
      [3, 5],
    ]);
  });

  it("decreases steps", () => {
    helper.setMaxValue(3);

    expect(
      helper.updateSteps(
        [
          [1, 3],
          [2, 4],
          [3, 5],
        ],
        2
      )
    ).toStrictEqual([
      [1, 3],
      [2, 5],
    ]);
  });
  it.each([
    [
      "from mapping",
      {
        mapping: [
          [10, 1],
          [11, 1],
        ],
        expected: [
          [10, 1],
          [11, 1],
        ],
      },
    ],

    [
      "from empty mapping",
      {
        mapping: [],
        expected: [
          [0, 0],
          [0.5, 0],
        ],
      },
    ],
    [
      "from a too small mapping",
      {
        mapping: [[0, 1]],
        expected: [
          [0, 1],
          [0.5, 1],
        ],
      },
    ],
    [
      "with reset min max",
      {
        mapping: [
          [10, 1],
          [11, 1],
        ],
        resetMinMax: true,
        expected: [
          [0, 1],
          [0.5, 1],
        ],
      },
    ],
  ])(
    "initializes %s",
    (
      _: string,
      params: {
        mapping: number[][];
        resetMinMax?: boolean;
        expected: number[][];
      }
    ) => {
      const helper = new BucketValueMappingHelper({
        summary: {
          name: "attribute",
          data_type: "DOUBLE",
          min_val: 0,
          max_val: 1,
        },
        strategy: new DummyStrategy({ nSteps: 2 }),
      });
      expect(
        helper.initializeMapping(params.mapping as ValueMapping<number>, {
          resetMinMax: params.resetMinMax,
        })
      ).toStrictEqual(params.expected);
    }
  );
  it("overrides max value", () => {
    const mapping: ValueMapping<number> = [
      [0, 10],
      [2, 11],
    ];
    expect(helper.initializeMapping(mapping, { overrideMax: 2 })).toStrictEqual([
      [0, 10],
      [1, 11],
    ]);
  });
});

describe("BooleanValueMappingHelper", () => {
  let helper: BooleanValueMappingHelper<number>;
  beforeEach(() => {
    helper = new BooleanValueMappingHelper({
      summary: {
        name: "attribute",
        data_type: "BOOLEAN",
        min_val: 0,
        max_val: 1,
      },
      strategy: new DummyStrategy(),
    });
  });
  it("resets min and max", () => {
    expect(
      helper.resetMinMax([
        [1, 3],
        [10, 4],
      ])
    ).toStrictEqual([
      [0, 3],
      [1, 4],
    ]);
  });
  it("resets to 0 and 1 even without help of summary", () => {
    helper = new BooleanValueMappingHelper({
      summary: {
        name: "attribute",
        data_type: "BOOLEAN",
        min_val: 0,
        max_val: 0,
      },
      strategy: new DummyStrategy(),
    });
    expect(
      helper.resetMinMax([
        [1, 3],
        [10, 4],
      ])
    ).toStrictEqual([
      [0, 3],
      [1, 4],
    ]);
  });
  it("linearize just resets", () => {
    expect(
      helper.linearizeValues([
        [1, 3],
        [2.5, 4],
      ])
    ).toStrictEqual([
      [0, 3],
      [1, 4],
    ]);
  });

  it("changing steps always sets to two", () => {
    expect(
      helper.updateSteps(
        [
          [0, 3],
          [0, 3],
          [1, 5],
        ],
        4
      )
    ).toStrictEqual([
      [0, 3],
      [1, 5],
    ]);
  });

  it.each([
    [
      "from mapping",
      {
        mapping: [
          [10, 1],
          [11, 1],
        ],
        expected: [
          [0, 1],
          [1, 1],
        ],
      },
    ],

    [
      "from empty mapping",
      {
        mapping: [],
        expected: [
          [0, 0],
          [1, 0],
        ],
      },
    ],
    [
      "from a too small mapping",
      {
        mapping: [[0, 1]],
        expected: [
          [0, 1],
          [1, 1],
        ],
      },
    ],
    [
      "from a too large mapping",
      {
        mapping: [
          [10, 1],
          [11, 2],
          [12, 3],
        ],
        expected: [
          [0, 1],
          [1, 3],
        ],
      },
    ],
  ])(
    "initializes %s",
    (
      _: string,
      params: {
        mapping: number[][];
        expected: number[][];
      }
    ) => {
      const helper = new BooleanValueMappingHelper({
        summary: {
          name: "attribute",
          data_type: "DOUBLE",
          min_val: 0,
          max_val: 1,
        },
        strategy: new DummyStrategy({ nSteps: 2 }),
      });
      expect(helper.initializeMapping(params.mapping as ValueMapping<number>)).toStrictEqual(
        params.expected
      );
    }
  );
});

describe("EnumValueMappingHelper", () => {
  let helper: EnumValueMappingHelper<number>;
  beforeEach(() => {
    helper = new EnumValueMappingHelper({
      summary: {
        name: "attribute",
        data_type: "INT",
        min_val: 0,
        max_val: 1,
        enum_name: "some_enum",
      },
      strategy: new DummyStrategy(),
      enums: { some_enum: ["a", "b", "c"] },
    });
  });
  it("resets min and max", () => {
    expect(
      helper.resetMinMax([
        [1, 3],
        [10, 4],
      ])
    ).toStrictEqual([
      [0, 3],
      [1, 3.5],
      [2, 4],
    ]);
  });

  it("linearize just resets", () => {
    expect(
      helper.linearizeValues([
        [1, 3],
        [2.5, 4],
      ])
    ).toStrictEqual([
      [0, 3],
      [1, 3.5],
      [2, 4],
    ]);
  });

  it("changing steps always sets to enum size", () => {
    expect(
      helper.updateSteps(
        [
          [0, 3],
          [0, 3],
          [1, 5],
        ],
        4
      )
    ).toStrictEqual([
      [0, 3],
      [1, 3],
      [2, 5],
    ]);
  });

  it.each([
    [
      "from mapping",
      {
        mapping: [
          [10, 1],
          [11, 1],
          [12, 1],
        ],
        expected: [
          [0, 1],
          [1, 1],
          [2, 1],
        ],
      },
    ],

    [
      "from empty mapping",
      {
        mapping: [],
        expected: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
      },
    ],
    [
      "from a too small mapping",
      {
        mapping: [[0, 1]],
        expected: [
          [0, 1],
          [1, 1],
          [2, 1],
        ],
      },
    ],
    [
      "from a too large mapping",
      {
        mapping: [
          [10, 1],
          [11, 2],
          [12, 3],
          [13, 3],
        ],
        expected: [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      },
    ],
  ])(
    "initializes %s",
    (
      _: string,
      params: {
        mapping: number[][];
        expected: number[][];
      }
    ) => {
      expect(helper.initializeMapping(params.mapping as ValueMapping<number>)).toStrictEqual(
        params.expected
      );
    }
  );
});

describe("createValueMappingHelper", () => {
  it.each([
    [
      "ContinuousValueMappingHelper for DOUBLE",
      {
        dataType: "DOUBLE",
        expected: ContinuousValueMappingHelper,
      },
    ],
    [
      "ContinuousValueMappingHelper for INT",
      {
        dataType: "INT",
        expected: ContinuousValueMappingHelper,
      },
    ],
    [
      "BucketValueMappingHelper for DOUBLE",
      {
        dataType: "DOUBLE",
        buckets: true,
        expected: BucketValueMappingHelper,
      },
    ],
    [
      "BucketValueMappingHelper for INT",
      {
        dataType: "INT",
        buckets: true,
        expected: BucketValueMappingHelper,
      },
    ],

    [
      "BooleanValueMappingHelper for BOOLEAN",
      {
        dataType: "BOOLEAN",
        expected: BooleanValueMappingHelper,
      },
    ],
    [
      "EnumValueMappingHelper for enums",
      {
        dataType: "INT",
        enumName: "some_enum",
        enums: {},
        expected: EnumValueMappingHelper,
      },
    ],
  ])(
    "creates %s",
    (
      _: string,
      params: {
        dataType: string;
        buckets?: boolean;
        enumName?: string;
        enums?: Record<string, string[]>;
        expected: unknown;
      }
    ) => {
      const summary = {
        name: "attribute",
        component: "",
        data_type: params.dataType,
        min_val: null,
        max_val: null,
        enum_name: params.enumName,
      };
      expect(
        createValueMappingHelper({
          summary,
          buckets: Boolean(params.buckets),
          strategy: new DummyStrategy(),
          enums: params.enums,
        })
      ).toBeInstanceOf(params.expected);
    }
  );
});

describe("recalculateMappingValues", () => {
  it.each([
    [
      "shrinks values arrays",
      {
        values: [0, 2, 4, 6],
        nSteps: 3,
      },
      [0, 3, 6],
    ],
    [
      "grows values arrays",
      {
        values: [0, 1, 2, 6],
        nSteps: 7,
      },
      [0, 1, 2, 3, 4, 5, 6],
    ],
    [
      "doesnt recalculate when nSteps remains the same",
      {
        values: [0, 1, 2, 6],
        nSteps: 4,
      },
      [0, 1, 2, 6],
    ],
    [
      "doesnt recalculate when nSteps remains the same while supplying min and max value",
      {
        values: [0, 1, 2, 6],
        nSteps: 4,
        minValue: 1,
        maxValue: 2,
      },
      [0, 1, 2, 6],
    ],
    [
      "recalculates same size array when forced to do so",
      {
        values: [0, 1, 2, 6],
        nSteps: 4,
        forceRecalculateValues: true,
      },
      [0, 2, 4, 6],
    ],

    [
      "recalculates based on max value",
      {
        values: [0, 0.25, 0.5, 0.75],
        nSteps: 2,
        maxValue: 1,
      },
      [0, 0.5],
    ],
    [
      "recalculates based on min value",
      {
        values: [0, 0.25, 0.5, 2],
        nSteps: 3,
        minValue: 1,
      },
      [1, 1.5, 2],
    ],
    [
      "recalculates based on min and max value",
      {
        values: [0, 0.25, 0.5, 1],
        nSteps: 3,
        minValue: 1,
        maxValue: 2.5,
      },
      [1, 1.5, 2],
    ],
    [
      "can use max value as last value",
      {
        values: [0, 0.25, 0.5, 1],
        nSteps: 3,
        maxValueAsLastValue: true,
        maxValue: 2,
      },
      [0, 1, 2],
    ],
    [
      "can min and max value when not supplying initial values",
      {
        values: [],
        nSteps: 3,
        minValue: 1,
        maxValue: 3,
        maxValueAsLastValue: true,
      },
      [1, 2, 3],
    ],
  ])("%s", (_: string, params: RecalculateMappingValueParams, expected: number[]) => {
    expect(recalculateMappingValues(params)).toStrictEqual(expected);
  });
});

describe("interpolateMinMax", () => {
  it("interpolates without maxValueAsLastValue", () => {
    expect(interpolateMinMax(0, 2, 2)).toStrictEqual([0, 1]);
  });
  it("interpolates with maxValueAsLastValue", () => {
    expect(interpolateMinMax(0, 2, 3, true)).toStrictEqual([0, 1, 2]);
  });
});
