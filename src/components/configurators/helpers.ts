export type PlaceholderType = 'single' | 'range';

export interface RecalculateMappingValueParams {
  values: number[];
  nSteps: number;
  minValue?: number;
  maxValue?: number;
  forceRecalculateValues?: boolean;
  maxValueAsLastValue?: boolean;
}
export interface RecalculateMappingParams<T> extends RecalculateMappingValueParams {
  output: T[];
  interpolateOutput?: boolean;
}

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

export function recalculateMapping<T>(
  params: RecalculateMappingParams<T>,
  getDefault: () => T
): [number, T][] {
  const output = recalculateOutput(params, getDefault);
  return recalculateMappingValues(params).map((val, idx) => [val, output[idx]]);
}

function recalculateOutput<T>(
  params: { output: T[]; nSteps: number; interpolateOutput?: boolean },
  getDefault: () => T
): T[] {
  if (!params.output.length) {
    return [];
  }
  if (params.interpolateOutput) {
    if (typeof params.output[0] !== 'number') {
      throw new Error('Can only interpolate number output');
    }
    const first = params.output[0] ?? getDefault();
    const last = (params.output[params.output.length - 1] ?? getDefault()) as unknown as number;
    return interpolateMinMax(first, last, params.nSteps, true) as unknown as T[];
  }

  const rv = Array(params.nSteps).fill(getDefault());
  params.output.forEach((c, idx) => (rv[idx] = c));
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
  let max = params.values[params.values.length - 1];

  let maxValueAsLastValue = true;
  if (params.maxValue !== undefined) {
    max = params.maxValue;
    maxValueAsLastValue = params.maxValueAsLastValue ?? false;
  }

  return interpolateMinMax(min, max, params.nSteps, maxValueAsLastValue);
}

export function interpolateMinMax(
  min: number,
  max: number,
  nSteps: number,
  maxValueAsLastValue = false
) {
  const stepSize = (max - min) / (maxValueAsLastValue ? nSteps - 1 : nSteps),
    rv: number[] = [];

  for (let index = 0; index < nSteps; index++) {
    const val = min + stepSize * index;
    rv.push(parseFloat(val.toFixed(3)));
  }

  return rv;
}

export function attributeValidator(
  configurator: {
    $t: Vue['$t'];
    selectedEntityProp: unknown;
    filteredEntityProps?: unknown[];
  },
  doValidate: () => boolean
) {
  return () => {
    if (doValidate()) {
      if (!configurator.filteredEntityProps?.length) {
        return '' + configurator.$t('flow.visualization.noCompatibleAttributes');
      }

      if (!configurator.selectedEntityProp) {
        return 'Please select an attribute for the configurator to be based on';
      }
    }
  };
}
