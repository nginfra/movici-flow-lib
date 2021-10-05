export interface ColorPaletteParams {
    name: string;
    colors: string[];
    colorsForSize: Record<number, number[]>;
    reversed?: boolean;
}
export default class ColorPalette {
    name: string;
    colors: string[];
    colorsForSize: Record<number, number[]>;
    reversed: boolean;
    constructor({ name, colors, colorsForSize, reversed }: ColorPaletteParams);
    getHexColorsForSize(size: number): string[];
    getColorTriplesForSize(size: number): import("../../../types").RGBAColor[];
}
export declare const DEFAULT_COLOR_PALETTES: Record<string, ColorPalette[]>;
