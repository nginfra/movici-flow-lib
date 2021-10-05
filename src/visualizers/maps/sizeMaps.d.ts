import { Mapper, Nullable } from '@/types';
declare type SizeMapConfig = {
    sizes: [number, number][];
};
export declare class NumberSizeMap implements Mapper<number | null, number> {
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
    useCache: boolean;
    cache: Map<number | null, number>;
    values: number[];
    sizes: number[];
    constructor(config: SizeMapConfig);
    getValue(value: Nullable<number>): number;
    calculateSize(value: number | null): number;
}
export {};
