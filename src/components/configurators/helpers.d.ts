import { ColorMapping, RGBAColor } from '@/types';
export declare type PlaceholderType = 'single' | 'range';
export declare type RecalculateMappingValueParams = {
    values: number[];
    nSteps: number;
    minValue?: number;
    maxValue?: number;
    forceRecalculateValues?: boolean;
    maxValueAsLastValue?: boolean;
};
export declare function getLegendPlaceholders(items: number[], type: PlaceholderType, maxValue?: number): string[];
export declare function getSingleLegendPlaceholder(items: number[], type: PlaceholderType, maxValue: number | undefined, index: number): string;
export declare function recalculateColorMapping(params: RecalculateMappingValueParams & {
    colors: RGBAColor[];
}): ColorMapping;
export declare function recalculateMappingValues(params: RecalculateMappingValueParams): number[];
