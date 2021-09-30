import { RGBAColor } from '@/flow/src//types';

/**
 * Given two subsequent entries in a color mapping, calculate intermediate colors. It linearly
 * interpolates between the two entries, and outputs the intermediate entries in an array. The
 * length of the output array is governed by nSteps
 *
 * @param a: The lower colormap entry
 * @param b: the higher colormap entry
 * @param nSteps number of steps
 */
export function interpolateColorMapping(
  a: [number, RGBAColor],
  b: [number, RGBAColor],
  nSteps: number
): [number, RGBAColor][] {
  if (nSteps <= 0) {
    return [];
  }

  const rv: [number, RGBAColor][] = Array(nSteps);
  const stepSize = (b[0] - a[0]) / (nSteps + 1);
  for (let step = 1; step < nSteps + 1; step++) {
    const value = a[0] + stepSize * step;
    const color = interpolateColor(a[1], b[1], step, nSteps + 1);
    rv[step - 1] = [value, color];
  }
  return rv;
}

function interpolateColor(a: RGBAColor, b: RGBAColor, step: number, nSteps: number): RGBAColor {
  if (nSteps <= 0) {
    throw new Error('must have positive number of steps');
  }
  if (step < 0 || step >= nSteps) {
    throw new Error('Step nog in between 0 and nSteps');
  }
  if (a.length != b.length) {
    throw new Error('Incompatible colors');
  }
  const rv: RGBAColor = Array(a.length) as RGBAColor;

  for (let i = 0; i < a.length; i++) {
    const aa = a[i];
    const bb = b[i];
    if (aa === undefined || bb === undefined) {
      continue;
    }
    rv[i] = Math.floor(aa + ((bb - aa) / nSteps) * step);
  }

  return rv;
}
