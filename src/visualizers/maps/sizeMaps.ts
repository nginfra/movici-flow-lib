import { Mapper, Nullable } from '@/types';

type SizeMapConfig = {
  sizes: [number, number][];
};

export class NumberSizeMap implements Mapper<number | null, number> {
  /**
   * Maps a number to a size. Also works for booleans. The config constructor
   *  parameter has the following keys
   *    values: an array of values
   *
   * A size is calculated as following:
   *   * A size is valid for values starting from it's assigned value in the `values` until
   *     the next value is found. eg for a value` array `[0, 2]` for input `1` the calculated size
   *     would be the size assigned to `0` as that is the highest value lower than our input
   *   * for inputs lower than the lowest value in our `values` array, the first size is used
   */
  useCache = false;
  cache: Map<number | null, number>;

  values: number[];
  sizes: number[];

  constructor(config: SizeMapConfig) {
    this.values = config.sizes.map(c => c[0]);
    this.sizes = config.sizes.map(c => c[1]);
    this.cache = new Map();
  }

  getValue(value: Nullable<number>): number {
    let size;
    if (this.useCache) {
      size = this.cache.get(value);
      if (size) {
        return size;
      }
    }

    size = this.calculateSize(value);
    if (this.useCache) {
      this.cache.set(value, size);
    }
    return size;
  }

  calculateSize(value: number | null): number {
    if (value === null || !this.values.length || isNaN(value)) return 0;
    if (this.values.length == 1 || value <= this.values[0]) return this.sizes[0];
    if (value >= this.values[this.values.length - 1]) return this.sizes[this.sizes.length - 1];
    for (let i = this.values.length - 2; i >= 0; i--) {
      if (value >= this.values[i]) {
        return getInterpolatedValue(
          this.values[i],
          this.sizes[i],
          this.values[i + 1],
          this.sizes[i + 1],
          value
        );
      }
    }
    throw new Error('Programming error while calculating sizes');
  }
}

function getInterpolatedValue(X1: number, Y1: number, X2: number, Y2: number, x: number) {
  return Y1 + ((Y2 - Y1) / (X2 - X1)) * (x - X1);
}
