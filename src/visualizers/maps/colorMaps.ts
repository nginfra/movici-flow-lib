import { RGBAColor, Nullable, Mapper } from '@movici-flow-common/types';

export const MoviciColors = {
  GREEN: '#1AB67E',
  ORANGE: '#F18759',
  RED: '#E54B4B',
  BLUE: '#5571F2',
  NAVY_BLUE: '#2962FF',
  LIGHT_BLUE: '#99AAF7',
  YELLOW: '#E8B53E',
  PURPLE: '#A258DC',
  PINK: '#F98BA6',
  LIGHT_PINK: '#F5B7B7',
  LIGHTEST_PINK: '#FADBDB',
  BROWN: '#BA763D',
  OLIVE: '#B2FF59',
  TURQUOISE: '#00BFA5',
  TEAL: '#18FFFF',
  WHITE: '#F1F1F1',
  VERY_LIGHT_GREY: '#CCCCCC',
  LIGHT_GREY: '#777777',
  DARK_GREY: '#333333',
  VERY_DARK_GREY: '#202020',
  BLACK: '#000000'
};

interface ColormapConfig {
  colors: [number, RGBAColor][];
  specialColor: RGBAColor;
  undefinedColor: RGBAColor;
}

export class NumberColorMap implements Mapper<number | null, RGBAColor> {
  /**
   * Maps a number to a color. Also works for booleans. The config constructor
   *  parameter has the following keys
   *    values: an array of values
   *    colors: an array of colors that the values should map to
   *    special: the `special` value (eg NaN for most floating point properties)
   *    specialColor: the color of the special value
   *    undefined: the `undefined` value (eg null for most properties)
   *    undefinedColor: the color of the undefined value
   *
   * A Color is calculated as following:
   *   * special values and undefined values are assigned their own color
   *   * A color is valid for values starting from it's assigned value in the `values` until
   *     the next value is found. eg for a value` array `[0, 2]` for input `1` the calculated color
   *     would be the color assigned to `0` as that is the highest value lower than our input
   *   * for inputs lower than the lowest value in our `values` array, the first color is used
   */
  special: number;
  specialColor: RGBAColor;
  undefined: Nullable<number>;
  undefinedColor: RGBAColor;
  values: number[];
  colors: RGBAColor[];
  useCache = false;
  cache: Map<number | null, RGBAColor>;

  constructor(config: ColormapConfig) {
    this.special = NaN;
    this.specialColor = config.specialColor;
    this.undefined = null;
    this.undefinedColor = config.undefinedColor;
    this.values = config.colors.map(c => c[0]);
    this.colors = config.colors.map(c => c[1]);
    this.cache = new Map();
  }

  getValue(value: Nullable<number>): RGBAColor {
    if (this.useCache) {
      const color = this.cache.get(value);
      if (color) {
        return color;
      }
    }

    const color = this.calculateColor(value);
    if (this.useCache) {
      this.cache.set(value, color);
    }
    return color;
  }

  setSpecialValue(val?: number | null) {
    if (val === null || val === undefined) return;
    this.special = val;
  }
  calculateColor(value: number | null): RGBAColor {
    if (this.isSpecial(value)) return this.specialColor;
    if (this.isUndefined(value)) return this.undefinedColor;
    if (!this.values.length) return this.undefinedColor;
    if (value <= this.values[0]) return this.colors[0];
    for (let i = this.values.length - 1; i >= 0; i--) {
      if (value >= this.values[i]) {
        return this.colors[i];
      }
    }
    throw new Error('Programming error while calculating color');
  }

  isUndefined(value: Nullable<number>): value is null {
    if (this.undefined === null || value === null) {
      return this.undefined === value;
    }
    if (isNaN(this.undefined)) return isNaN(value);
    return this.undefined === value;
  }

  isSpecial(value: Nullable<number>) {
    if (value === null) {
      return false;
    }
    if (isNaN(this.special)) return isNaN(value);
    return this.special === value;
  }
}

export class IntColorMap extends NumberColorMap {
  useCache = true;
}

export function colorTripleToHex(color: RGBAColor): string {
  let rv = '#';
  for (const c of color) {
    if (c !== undefined) {
      rv += ('0' + c.toString(16)).slice(-2);
    }
  }
  return rv;
}

export function hexToColorTriple(hexColor: string): RGBAColor {
  const match = hexColor
    .toLowerCase()
    .match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/);
  if (!match) {
    throw new Error(`'${hexColor}' is not a valid hexadecimal color`);
  }
  const rv = match.splice(1).map(i => (i ? parseInt(i, 16) : undefined));
  if (rv[3] === undefined) {
    rv.splice(3);
  }
  return rv as RGBAColor;
}
