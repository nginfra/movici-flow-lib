import { hexToColorTriple, MoviciColors } from '@/visualizers/maps/colorMaps';
export function getLegendPlaceholders(items, type, maxValue) {
    if (!items.length)
        return [];
    return items.map((_, index) => getSingleLegendPlaceholder(items, type, maxValue, index));
}
export function getSingleLegendPlaceholder(items, type, maxValue, index) {
    var _a, _b;
    if (index > items.length - 1) {
        throw RangeError('index out of bounds');
    }
    let rv = `${items[index]}`;
    if (type === 'range') {
        rv += ' - ' + ((_b = (_a = items[index + 1]) !== null && _a !== void 0 ? _a : maxValue) !== null && _b !== void 0 ? _b : '');
    }
    return rv;
}
export function recalculateColorMapping(params) {
    const colors = recalculateColors(params);
    return recalculateMappingValues(params).map((val, idx) => [val, colors[idx]]);
}
function recalculateColors(params) {
    const rv = Array(params.nSteps).fill(hexToColorTriple(MoviciColors.WHITE));
    params.colors.forEach((c, idx) => (rv[idx] = c));
    return rv;
}
export function recalculateMappingValues(params) {
    var _a;
    if (!params.values.length && (params.minValue === undefined || params.maxValue === undefined)) {
        throw new Error('Insufficient input to recalculate values');
    }
    if (params.values.length === params.nSteps && !params.forceRecalculateValues) {
        return params.values;
    }
    const min = (_a = params.minValue) !== null && _a !== void 0 ? _a : params.values[0];
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
