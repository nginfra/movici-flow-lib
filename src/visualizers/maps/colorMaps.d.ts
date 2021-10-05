import { RGBAColor, ColorMapColorSettings, ColorRuleSet, Nullable, PropertyType, Mapper } from '@//types';
export declare const MoviciColors: {
    PURPLE: string;
    GREEN: string;
    ORANGE: string;
    RED: string;
    BLUE: string;
    LIGHT_BLUE: string;
    YELLOW: string;
    PINK: string;
    LIGHT_PINK: string;
    LIGHTEST_PINK: string;
    BROWN: string;
    WHITE: string;
    LIGHT_GREY: string;
    DARK_GREY: string;
    VERY_DARK_GREY: string;
    BLACK: string;
};
export declare function mergeColorRuleSets(...ruleSets: ColorRuleSet[]): ColorRuleSet;
/**
 * Generates Color settings for a `ColorMap` based on a `ColorRuleSet`. `ColorRule`s
 * are applied until all required fields are set
 * @param entityGroup: The entity type to visualize
 * @param property: The property/attribute
 * @param ruleSet: a color rule set
 *
 * @returns `ColorMapColorSettings`
 */
export declare function generateColorSettings(entityGroup: string, property: PropertyType | null, ruleSet: ColorRuleSet): ColorMapColorSettings;
interface ColormapConfig {
    colors: [number, RGBAColor][];
    special?: number;
    specialColor: RGBAColor;
    undefined?: Nullable<number>;
    undefinedColor: RGBAColor;
}
export declare class NumberColorMap implements Mapper<number | null, RGBAColor> {
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
    useCache: boolean;
    cache: Map<number | null, RGBAColor>;
    constructor(config: ColormapConfig);
    getValue(value: Nullable<number>): RGBAColor;
    calculateColor(value: number | null): RGBAColor;
    isUndefined(value: Nullable<number>): value is null;
    isSpecial(value: Nullable<number>): boolean;
}
export declare class IntColorMap extends NumberColorMap {
    useCache: boolean;
}
export declare function colorTripleToHex(color: RGBAColor): string;
export declare function hexToColorTriple(hexColor: string): RGBAColor;
export {};
