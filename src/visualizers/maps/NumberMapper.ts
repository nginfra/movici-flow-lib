import type { Mapper } from "@movici-flow-common/types";

interface NumberMapConfig<T> {
  mapping: [number, T][];
  specialResult: T;
  undefinedResult: T;
}

export default class NumberMapper<T> implements Mapper<number | null, T> {
  /**
   * Maps a number to a result <T>. Also works for booleans. The config constructor
   *  parameter has the following keys
   *    values: an array of values
   *    mapping: an array of <T> that the values should map to
   *    special: the `special` value (eg NaN for most floating point properties)
   *    specialColor: the <T> of the special value
   *    undefined: the `undefined` value (eg null for most properties)
   *    undefinedColor: the <T> of the undefined value
   *
   * A Result<T> is calculated as following:
   *   * special values and undefined values are assigned their own <T>
   *   * A <T> is valid for values starting from it's assigned value in the `values` until
   *     the next value is found. eg for a value` array `[0, 2]` for input `1` the calculated <T>
   *     would be the <T> assigned to `0` as that is the highest value lower than our input
   *   * for inputs lower than the lowest value in our `values` array, the first <T> is used
   */
  special: number;
  specialResult: T;
  undefined: number | null;
  undefinedResult: T;
  values: number[];
  results: T[];
  useCache = false;
  cache: Map<number | null, T>;

  constructor(config: NumberMapConfig<T>) {
    this.special = NaN;
    this.specialResult = config.specialResult;
    this.undefined = null;
    this.undefinedResult = config.undefinedResult;
    this.values = config.mapping.map((m) => m[0]);
    this.results = config.mapping.map((m) => m[1]);
    this.cache = new Map();
  }

  getValue(value: number | null): T {
    if (this.useCache) {
      const result = this.cache.get(value);
      if (result) {
        return result;
      }
    }

    const result = this.calculateResult(value);
    if (this.useCache) {
      this.cache.set(value, result);
    }
    return result;
  }

  setSpecialValue(val?: number | null) {
    if (val === null || val === undefined) return;
    this.special = val;
  }
  calculateResult(value: number | null): T {
    if (this.isSpecial(value)) return this.specialResult;
    if (this.isUndefined(value)) return this.undefinedResult;
    if (!this.values.length) return this.undefinedResult;
    if (value <= this.values[0]) return this.results[0];
    for (let i = this.values.length - 1; i >= 0; i--) {
      if (value >= this.values[i]) {
        return this.results[i];
      }
    }
    throw new Error("Programming error while calculating color");
  }

  isUndefined(value: number | null): value is null {
    if (this.undefined === null || value === null) {
      return this.undefined === value;
    }
    if (isNaN(this.undefined)) return isNaN(value);
    return this.undefined === value;
  }

  isSpecial(value: number | null) {
    if (value === null) {
      return false;
    }
    if (isNaN(this.special)) return isNaN(value);
    return this.special === value;
  }
}
