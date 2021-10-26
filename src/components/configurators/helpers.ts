import { ColorMapping, RGBAColor } from '@/flow/types';
import { hexToColorTriple, MoviciColors } from '@/flow/visualizers/maps/colorMaps';

export type PlaceholderType = 'single' | 'range';

export type RecalculateMappingValueParams = {
  values: number[];
  nSteps: number;
  minValue?: number;
  maxValue?: number;
  forceRecalculateValues?: boolean;
  maxValueAsLastValue?: boolean;
};

export function getLegendPlaceholders(
  items: number[],
  type: PlaceholderType,
  maxValue?: number
): string[] {
  if (!items.length) return [];
  return items.map((_, index) => getSingleLegendPlaceholder(items, type, maxValue, index));
}

export function getSingleLegendPlaceholder(
  items: number[],
  type: PlaceholderType,
  maxValue: number | undefined,
  index: number
): string {
  if (index > items.length - 1) {
    throw RangeError('index out of bounds');
  }
  let rv = `${items[index]}`;
  if (type === 'range') {
    rv += ' - ' + (items[index + 1] ?? maxValue ?? '');
  }
  return rv;
}

export function recalculateColorMapping(
  params: RecalculateMappingValueParams & { colors: RGBAColor[] }
): ColorMapping {
  const colors = recalculateColors(params);
  return recalculateMappingValues(params).map((val, idx) => [val, colors[idx]]);
}

function recalculateColors(params: { colors: RGBAColor[]; nSteps: number }): RGBAColor[] {
  const rv = Array(params.nSteps).fill(hexToColorTriple(MoviciColors.WHITE));
  params.colors.forEach((c, idx) => (rv[idx] = c));
  return rv;
}

export function recalculateMappingValues(params: RecalculateMappingValueParams): number[] {
  if (!params.values.length && (params.minValue === undefined || params.maxValue === undefined)) {
    throw new Error('Insufficient input to recalculate values');
  }

  if (params.values.length === params.nSteps && !params.forceRecalculateValues) {
    return params.values;
  }

  const min = params.minValue ?? params.values[0];
  const rv = [];
  let max = params.values[params.values.length - 1];
  let nSteps = params.nSteps - 1;

  if (params.maxValue !== undefined) {
    max = params.maxValue;
    if (!params.maxValueAsLastValue) {
      nSteps++;
    }
  }
  const stepSize = (max - min) / nSteps;
  for (let index = 0; index < params.nSteps; index++) {
    const val = min + stepSize * index;
    rv.push(parseFloat(val.toFixed(3)));
  }
  return rv;
}
