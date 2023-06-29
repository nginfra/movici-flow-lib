import type { RGBAColor } from "../types";
import { MoviciColors, hexToColorTriple } from "@movici-flow-lib/visualizers/maps/colorMaps";

export const DEFAULT_SPECIAL_COLOR_TRIPLE = hexToColorTriple(MoviciColors.VERY_DARK_GREY);
export const DEFAULT_UNDEFINED_COLOR_TRIPLE = hexToColorTriple(MoviciColors.VERY_DARK_GREY);
export const DEFAULT_POLYGON_FILL_OPACITY = 33;
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
    throw new Error("must have positive number of steps");
  }
  if (step < 0 || step >= nSteps) {
    throw new Error("Step not in between 0 and nSteps");
  }

  if (a.length === 4) {
    b = ensureRGBAColor(b);
  } else if (b.length === 4) {
    a = ensureRGBAColor(a);
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
export function ensureRGBAColorMap(
  colormap: [number, RGBAColor][],
  defaultOpacity = 255
): [number, RGBAColor][] {
  return colormap.map(([value, color]) => {
    return [value, ensureRGBAColor(color, defaultOpacity)];
  });
}

function ensureRGBAColor(color: RGBAColor, defaultOpacity = 255) {
  if (color[3] === undefined) {
    color[3] = defaultOpacity;
  }
  return color;
}

export function getContrastingColor(color: RGBAColor) {
  // Calculate the perceptive luminance (aka luma) - human eye favors green color...

  // Values taken from w3c (https://www.w3.org/TR/AERT/#color-contrast) adjusted a little
  // bit to make sure that movici green gets a white contrasting color
  // factors must sum to 1
  const luminance = (0.314 * color[0] + 0.557 * color[1] + 0.129 * color[2]) / 255;
  // Return black for bright colors, white for dark colors
  return (luminance > 0.5 ? [0, 0, 0, 255] : [255, 255, 255, 255]) as RGBAColor;
}
