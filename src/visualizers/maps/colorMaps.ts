import {
  RGBAColor,
  ColorMapColorSettings,
  ColorRuleSelector,
  ColorRuleSet,
  Nullable,
  PropertyType,
  Mapper
} from '@/flow/src//types';
import { propertyString } from '@/flow/src//utils';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';

export const MoviciColors = {
  PURPLE: '#A258DC',
  GREEN: '#1AB67E',
  ORANGE: '#F18759',
  RED: '#E54B4B',
  BLUE: '#5571F2',
  LIGHT_BLUE: '#99AAF7',
  YELLOW: '#E8B53E',
  PINK: '#F98BA6',
  LIGHT_PINK: '#F5B7B7',
  LIGHTEST_PINK: '#FADBDB',
  BROWN: '#BA763D',
  WHITE: '#F1F1F1',
  LIGHT_GREY: '#777777',
  DARK_GREY: '#333333',
  VERY_DARK_GREY: '#202020',
  BLACK: '#000000'
};

export function mergeColorRuleSets(...ruleSets: ColorRuleSet[]): ColorRuleSet {
  if (ruleSets.length === 0) {
    return {
      colors: {},
      rules: []
    };
  }
  const rv = cloneDeep(ruleSets[0]);
  for (const ruleset of ruleSets.splice(1)) {
    Object.assign(rv.colors, ruleset.colors);
    rv.rules.push(...(ruleset.rules || []));
  }
  return rv;
}

/**
 * Generates Color settings for a `ColorMap` based on a `ColorRuleSet`. `ColorRule`s
 * are applied until all required fields are set
 * @param entityGroup: The entity type to visualize
 * @param property: The property/attribute
 * @param ruleSet: a color rule set
 *
 * @returns `ColorMapColorSettings`
 */
export function generateColorSettings(
  entityGroup: string,
  property: PropertyType | null,
  ruleSet: ColorRuleSet
): ColorMapColorSettings {
  const rules = ruleSet.rules.slice().sort((a, b) => a.priority - b.priority);
  const requiredKeys: Set<keyof ColorMapColorSettings> = new Set([
    'colors',
    'specialColor',
    'undefinedColor',
    'baseColor'
  ]);
  const result: Partial<ColorMapColorSettings> = {};
  for (const rule of rules) {
    if (Array.from(requiredKeys).every(k => Object.prototype.hasOwnProperty.call(result, k))) break;
    if (!selectorMatches(entityGroup, property, rule.selector)) continue;

    if (!result.baseColor && rule.settings.baseColor) {
      result.baseColor = ruleSet.colors[rule.settings.baseColor] ?? rule.settings.baseColor;
    }

    if (!result.specialColor && rule.settings.specialColor) {
      result.specialColor =
        ruleSet.colors[rule.settings.specialColor] ?? rule.settings.specialColor;
    }

    if (!result.undefinedColor && rule.settings.undefinedColor) {
      result.undefinedColor =
        ruleSet.colors[rule.settings.undefinedColor] ?? rule.settings.undefinedColor;
    }

    if (!result.colors && rule.settings.colors) {
      result.colors = rule.settings.colors;

      for (const color of result.colors) {
        if (color[1] === null) {
          continue;
        }
        color[1] = ruleSet.colors[color[1]] ?? color[1];
      }
    }
  }
  if (!hasAllKeys(result, Array.from(requiredKeys))) {
    throw new Error('Incomplete Color Map Settings');
  }

  return result;
}

function hasAllKeys<T>(obj: Partial<T>, keys: Array<keyof T>): obj is T {
  return keys.every(k => Object.prototype.hasOwnProperty.call(obj, k));
}

function selectorMatches(
  entityGroup: string,
  property: PropertyType | null,
  selector: ColorRuleSelector
) {
  if (isEmpty(selector)) return false;
  if (selectorMatchesAlways(entityGroup, property, selector)) return true;

  return (
    selectorMatchesProperty(entityGroup, property, selector) &&
    selectorMatchesEntityGroup(entityGroup, property, selector) &&
    selectorMatchesDataType(entityGroup, property, selector)
  );
}
function selectorMatchesEntityGroup(
  entityGroup: string,
  property: PropertyType | null,
  selector: ColorRuleSelector
): boolean {
  return selector.entity_group ? selector.entity_group === entityGroup : true;
}

function selectorMatchesProperty(
  entityGroup: string,
  property: PropertyType | null,
  selector: ColorRuleSelector
): boolean {
  if (!selector.property) {
    return true;
  }
  return property ? selector.property === propertyString(property) : false;
}
function selectorMatchesDataType(
  entityGroup: string,
  property: PropertyType | null,
  selector: ColorRuleSelector
): boolean {
  if (!selector.data_type) {
    return true;
  }
  return property ? selector.data_type === property.data_type : false;
}
function selectorMatchesAlways(
  entityGroup: string,
  property: PropertyType | null,
  selector: ColorRuleSelector
) {
  return !!selector.always;
}

interface ColormapConfig {
  colors: [number, RGBAColor][];
  special?: number;
  specialColor: RGBAColor;
  undefined?: Nullable<number>;
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
    this.special = config?.special ?? NaN;
    this.specialColor = config.specialColor;
    this.undefined = config?.undefined ?? null;
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
