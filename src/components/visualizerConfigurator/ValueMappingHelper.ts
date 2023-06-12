import type { AttributeSummary, SimpleAttributeSummary } from "@movici-flow-common/types";

export type ValueMapping<T> = [number, T][];
export type MappingMode = "enum" | "buckets" | "boolean" | "number" | "continuous";

export function createValueMappingHelper<T>({
  summary,
  strategy,
  buckets,
  enums,
  maxValue,
}: {
  summary: SimpleAttributeSummary;
  strategy: MappingStrategy<T>;
  enums?: Record<string, string[]>;
  buckets?: boolean;
  maxValue?: number | null;
}): ValueMappingHelper<T> {
  if (["BOOLEAN", "INT", "DOUBLE", "FLOAT"].indexOf(summary.data_type) < 0) {
    throw new Error(`Unsupported data type ${summary.data_type}`);
  }
  const ctorArgs = { summary, strategy, enums };
  const rv = (() => {
    switch (summary.data_type) {
      case "BOOLEAN":
        return new BooleanValueMappingHelper(ctorArgs);
      case "INT":
        if (summary.enum_name) {
          return new EnumValueMappingHelper(ctorArgs);
        }
      // eslint-disable-next-line no-fallthrough
      default:
        if (buckets) {
          return new BucketValueMappingHelper(ctorArgs);
        }
        return new ContinuousValueMappingHelper(ctorArgs);
    }
  })();
  if (maxValue != null) {
    rv.setMaxValue(maxValue);
  }
  return rv;
}

export abstract class ValueMappingHelper<T> {
  abstract modeFlags: MappingMode[];
  buckets = false;
  protected summary: SimpleAttributeSummary;
  protected strategy: MappingStrategy<T>;
  protected maxValue: number | null;
  protected enums: Record<string, string[]>;

  constructor({
    summary,
    strategy,
    enums,
  }: {
    summary: SimpleAttributeSummary;
    strategy: MappingStrategy<T>;
    enums?: Record<string, string[]>;
  }) {
    this.summary = summary;
    this.strategy = strategy;
    this.maxValue = summary.max_val;
    this.enums = enums ?? {};
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMaxValue(mapping?: ValueMapping<unknown>) {
    return this.maxValue;
  }
  setMaxValue(val: number | null) {
    this.maxValue = val;
  }

  resetMinMax(mapping: ValueMapping<T>): ValueMapping<T> {
    return this.recalculateMapping({ mapping, resetMinMax: true });
  }

  linearizeValues(mapping: ValueMapping<T>): ValueMapping<T> {
    return this.recalculateMapping({
      mapping,
      forceRecalculateValues: true,
    });
  }

  updateSteps(mapping: ValueMapping<T>, nSteps: number): ValueMapping<T> {
    return this.recalculateMapping({ mapping, nSteps });
  }

  addRow(mapping: ValueMapping<T>): ValueMapping<T> {
    return [[0, this.strategy.defaultOutput()], ...mapping];
  }

  evolve(params: {
    summary?: AttributeSummary;
    strategy?: MappingStrategy<T>;
    enums?: Record<string, string[]>;
    buckets?: boolean;
  }): ValueMappingHelper<T> {
    return createValueMappingHelper({
      summary: params.summary ?? this.summary,
      strategy: params.strategy ?? this.strategy,
      enums: params.enums ?? this.enums,
      buckets: params.buckets ?? this.buckets,
    });
  }

  protected doRecalculateMapping({
    mapping,
    nSteps,
    minValue,
    maxValue,
    forceRecalculateValues,
  }: {
    mapping: ValueMapping<T>;
    nSteps?: number;
    minValue: number;
    maxValue: number;
    forceRecalculateValues?: boolean;
  }) {
    nSteps = nSteps ?? mapping.length;

    return recalculateMapping(
      {
        values: mapping.map((val) => val[0]),
        output: mapping.map((val) => val[1]),

        nSteps,
        minValue,
        maxValue,
        forceRecalculateValues,
        maxValueAsLastValue: !this.buckets,
      },
      this.strategy
    );
  }

  getMinMax(mapping: ValueMapping<T>, resetMinMax?: boolean) {
    let minValue = mapping[0]?.[0] ?? this.summary.min_val ?? 0;
    let maxValue = mapping[mapping.length - 1]?.[0] ?? this.summary.max_val ?? minValue;

    if (resetMinMax) {
      minValue = this.summary.min_val ?? minValue;
      maxValue = this.summary.max_val ?? maxValue;
    }

    return [minValue, maxValue];
  }
  abstract initializeMapping(
    mapping: ValueMapping<T>,
    options?: { overrideMax?: number | null; resetMinMax?: boolean }
  ): ValueMapping<T>;

  abstract recalculateMapping({
    mapping,
    nSteps,
    overrideMax,
    forceRecalculateValues,
    resetMinMax,
  }: {
    mapping: ValueMapping<T>;
    nSteps?: number;
    overrideMax?: number | null;
    forceRecalculateValues?: boolean;
    resetMinMax?: boolean;
  }): ValueMapping<T>;
}

export class ContinuousValueMappingHelper<T> extends ValueMappingHelper<T> {
  modeFlags: MappingMode[] = ["number", "continuous"];

  getMaxValue(mapping?: ValueMapping<unknown>) {
    if (mapping?.length) {
      return mapping[mapping.length - 1][0];
    }
    return this.maxValue;
  }

  initializeMapping(
    mapping: ValueMapping<T>,
    options?: { overrideMax?: number | null; resetMinMax?: boolean }
  ): ValueMapping<T> {
    if (options?.resetMinMax) {
      return this.resetMinMax(mapping);
    }
    if (options?.overrideMax) {
      return this.recalculateMapping({
        mapping,
        forceRecalculateValues: true,
        overrideMax: options.overrideMax,
      });
    }
    if (mapping.length < 2) {
      return this.strategy.defaultMapping(mapping, this);
    }
    return mapping;
  }

  recalculateMapping({
    mapping,
    nSteps,
    overrideMax,
    forceRecalculateValues,
    resetMinMax,
  }: {
    mapping: ValueMapping<T>;
    nSteps?: number;
    overrideMax?: number | null;
    forceRecalculateValues?: boolean;
    resetMinMax?: boolean;
  }): ValueMapping<T> {
    nSteps = nSteps ?? mapping.length;

    // eslint-disable-next-line prefer-const
    let [minValue, maxValue] = this.getMinMax(mapping, resetMinMax);
    if (overrideMax != null) {
      maxValue = overrideMax;
    }
    return this.doRecalculateMapping({
      mapping,
      nSteps,
      minValue,
      maxValue,
      forceRecalculateValues: resetMinMax || forceRecalculateValues,
    });
  }
}

export class BucketValueMappingHelper<T> extends ValueMappingHelper<T> {
  modeFlags: MappingMode[] = ["number", "buckets"];
  buckets = true;

  initializeMapping(
    mapping: ValueMapping<T>,
    options?: { overrideMax?: number | null; resetMinMax?: boolean }
  ): ValueMapping<T> {
    if (options?.resetMinMax) {
      return this.resetMinMax(mapping);
    } else if (options?.overrideMax != null) {
      this.setMaxValue(options.overrideMax);
      return this.linearizeValues(mapping);
    } else if (mapping.length < 2) {
      return this.strategy.defaultMapping(mapping, this);
    }
    return mapping;
  }

  resetMinMax(mapping: ValueMapping<T>): ValueMapping<T> {
    this.setMaxValue(this.summary.max_val ?? this.maxValue);
    return super.resetMinMax(mapping);
  }

  recalculateMapping({
    mapping,
    nSteps,
    forceRecalculateValues,
    resetMinMax,
  }: {
    mapping: ValueMapping<T>;
    nSteps?: number;
    overrideMax?: number | null;
    forceRecalculateValues?: boolean;
    resetMinMax?: boolean;
  }): ValueMapping<T> {
    nSteps = nSteps ?? mapping.length;
    // eslint-disable-next-line prefer-const
    let [minValue, maxValue] = this.getMinMax(mapping, resetMinMax);
    if (!resetMinMax && this.maxValue !== null) {
      maxValue = this.maxValue;
    }
    return this.doRecalculateMapping({
      mapping,
      nSteps,
      minValue,
      maxValue,
      forceRecalculateValues: resetMinMax || forceRecalculateValues,
    });
  }
}

export class BooleanValueMappingHelper<T> extends ValueMappingHelper<T> {
  modeFlags: MappingMode[] = ["boolean"];

  initializeMapping(mapping: ValueMapping<T>): ValueMapping<T> {
    return this.resetMinMax(mapping);
  }

  recalculateMapping({
    mapping,
    nSteps,
  }: {
    mapping: ValueMapping<T>;
    nSteps?: number;
    overrideMax?: number | null;
    forceRecalculateValues?: boolean;
    resetMinMax?: boolean;
  }): ValueMapping<T> {
    nSteps = 2;
    return this.doRecalculateMapping({
      mapping,
      nSteps,
      minValue: 0,
      maxValue: 1,
      forceRecalculateValues: true,
    });
  }
}

export class EnumValueMappingHelper<T> extends ValueMappingHelper<T> {
  modeFlags: MappingMode[] = ["enum"];

  initializeMapping(mapping: ValueMapping<T>): ValueMapping<T> {
    return this.resetMinMax(mapping);
  }
  get enumLabels(): string[] | null {
    return this.enums[this.summary.enum_name ?? ""] ?? null;
  }
  recalculateMapping({
    mapping,
  }: {
    mapping: ValueMapping<T>;
    nSteps?: number;
    overrideMax?: number | null;
    forceRecalculateValues?: boolean;
    resetMinMax?: boolean;
  }): ValueMapping<T> {
    const maxValue =
      this.enums[this.summary.enum_name ?? ""]?.length - 1 ?? Math.floor(this.summary.max_val ?? 1);

    return this.doRecalculateMapping({
      mapping,
      nSteps: maxValue + 1,
      minValue: 0,
      maxValue,
      forceRecalculateValues: true,
    });
  }
}
export abstract class MappingStrategy<T> {
  defaultMapping(mapping: ValueMapping<T>, helper: ValueMappingHelper<T>) {
    return helper.recalculateMapping({
      mapping,
      nSteps: this.defaultStepCount(),
      resetMinMax: true,
    });
  }

  recalculateOutputs(outputs: T[], nSteps: number): T[] {
    if (!nSteps) {
      return [];
    }
    if (outputs.length === nSteps) {
      return outputs;
    }
    return this.doRecalculateOutputs(outputs, nSteps);
  }

  protected doRecalculateOutputs(outputs: T[], nSteps: number): T[] {
    const rv = Array(nSteps).fill(this.defaultOutput());
    for (const [idx, val] of outputs.entries()) {
      rv[idx] = val;
    }
    return rv;
  }

  abstract defaultStepCount(): number;
  abstract defaultOutput(): T;
}

export interface RecalculateMappingValueParams {
  values: number[];
  nSteps: number;
  minValue?: number;
  maxValue?: number;
  forceRecalculateValues?: boolean;
  maxValueAsLastValue?: boolean;
}
export interface RecalculateMappingParams<T> extends RecalculateMappingValueParams {
  output: T[];
}
export function recalculateMapping<T>(
  params: RecalculateMappingParams<T>,
  strategy: MappingStrategy<T>
): [number, T][] {
  const output = strategy.recalculateOutputs(params.output, params.nSteps);
  return recalculateMappingValues(params).map((val, idx) => [val, output[idx]]);
}

export function recalculateMappingValues(params: RecalculateMappingValueParams): number[] {
  if (!params.values.length && (params.minValue === undefined || params.maxValue === undefined)) {
    throw new Error("Insufficient input to recalculate values");
  }

  if (params.values.length === params.nSteps && !params.forceRecalculateValues) {
    return params.values;
  }

  const min = params.minValue ?? params.values[0];
  let max = params.values[params.values.length - 1];

  let maxValueAsLastValue = true;
  if (params.maxValue !== undefined) {
    max = params.maxValue;
    maxValueAsLastValue = params.maxValueAsLastValue ?? false;
  }

  return interpolateMinMax(min, max, params.nSteps, maxValueAsLastValue);
}

export function interpolateMinMax(
  min: number,
  max: number,
  nSteps: number,
  maxValueAsLastValue = false
) {
  const stepSize = (max - min) / (maxValueAsLastValue ? nSteps - 1 : nSteps),
    rv: number[] = [];

  for (let index = 0; index < nSteps; index++) {
    const val = min + stepSize * index;
    rv.push(parseFloat(val.toFixed(3)));
  }

  return rv;
}
