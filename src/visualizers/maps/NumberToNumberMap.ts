import type { Mapper } from "@movici-flow-lib/types";

export default class NumberToNumberMap implements Mapper<number | null, number> {
  special: number;

  constructor() {
    this.special = NaN;
  }

  getValue(value: number | null): number {
    return value ?? this.special;
  }

  setSpecialValue(val?: number | null) {
    if (val === null || val === undefined) return;
    this.special = val;
  }
}
