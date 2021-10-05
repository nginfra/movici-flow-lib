import { RGBAColor } from '@//types';
/**
 * Given two subsequent entries in a color mapping, calculate intermediate colors. It linearly
 * interpolates between the two entries, and outputs the intermediate entries in an array. The
 * length of the output array is governed by nSteps
 *
 * @param a: The lower colormap entry
 * @param b: the higher colormap entry
 * @param nSteps number of steps
 */
export declare function interpolateColorMapping(a: [number, RGBAColor], b: [number, RGBAColor], nSteps: number): [number, RGBAColor][];
