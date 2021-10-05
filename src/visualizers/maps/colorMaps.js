import { propertyString } from '@//utils';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
export const MoviciColors = {
    PURPLE: '#A258DC',
    GREEN: '#1AB67E',
    ORANGE: '#F18759',
    RED: '#E54B4B',
    BLUE: '#5571F2',
    LIGHT_BLUE: '#99AAF7',
    YELLOW: '#E8B53E',
    PINK: '#F98BA6',
    LIGHT_PINK: '#F5B7B7',
    LIGHTEST_PINK: '#FADBDB',
    BROWN: '#BA763D',
    WHITE: '#F1F1F1',
    LIGHT_GREY: '#777777',
    DARK_GREY: '#333333',
    VERY_DARK_GREY: '#202020',
    BLACK: '#000000'
};
export function mergeColorRuleSets(...ruleSets) {
    if (ruleSets.length === 0) {
        return {
            colors: {},
            rules: []
        };
    }
    const rv = cloneDeep(ruleSets[0]);
    for (const ruleset of ruleSets.splice(1)) {
        Object.assign(rv.colors, ruleset.colors);
        rv.rules.push(...(ruleset.rules || []));
    }
    return rv;
}
/**
 * Generates Color settings for a `ColorMap` based on a `ColorRuleSet`. `ColorRule`s
 * are applied until all required fields are set
 * @param entityGroup: The entity type to visualize
 * @param property: The property/attribute
 * @param ruleSet: a color rule set
 *
 * @returns `ColorMapColorSettings`
 */
export function generateColorSettings(entityGroup, property, ruleSet) {
    var _a, _b, _c, _d;
    const rules = ruleSet.rules.slice().sort((a, b) => a.priority - b.priority);
    const requiredKeys = new Set([
        'colors',
        'specialColor',
        'undefinedColor',
        'baseColor'
    ]);
    const result = {};
    for (const rule of rules) {
        if (Array.from(requiredKeys).every(k => Object.prototype.hasOwnProperty.call(result, k)))
            break;
        if (!selectorMatches(entityGroup, property, rule.selector))
            continue;
        if (!result.baseColor && rule.settings.baseColor) {
            result.baseColor = (_a = ruleSet.colors[rule.settings.baseColor]) !== null && _a !== void 0 ? _a : rule.settings.baseColor;
        }
        if (!result.specialColor && rule.settings.specialColor) {
            result.specialColor =
                (_b = ruleSet.colors[rule.settings.specialColor]) !== null && _b !== void 0 ? _b : rule.settings.specialColor;
        }
        if (!result.undefinedColor && rule.settings.undefinedColor) {
            result.undefinedColor =
                (_c = ruleSet.colors[rule.settings.undefinedColor]) !== null && _c !== void 0 ? _c : rule.settings.undefinedColor;
        }
        if (!result.colors && rule.settings.colors) {
            result.colors = rule.settings.colors;
            for (const color of result.colors) {
                if (color[1] === null) {
                    continue;
                }
                color[1] = (_d = ruleSet.colors[color[1]]) !== null && _d !== void 0 ? _d : color[1];
            }
        }
    }
    if (!hasAllKeys(result, Array.from(requiredKeys))) {
        throw new Error('Incomplete Color Map Settings');
    }
    return result;
}
function hasAllKeys(obj, keys) {
    return keys.every(k => Object.prototype.hasOwnProperty.call(obj, k));
}
function selectorMatches(entityGroup, property, selector) {
    if (isEmpty(selector))
        return false;
    if (selectorMatchesAlways(entityGroup, property, selector))
        return true;
    return (selectorMatchesProperty(entityGroup, property, selector) &&
        selectorMatchesEntityGroup(entityGroup, property, selector) &&
        selectorMatchesDataType(entityGroup, property, selector));
}
function selectorMatchesEntityGroup(entityGroup, property, selector) {
    return selector.entity_group ? selector.entity_group === entityGroup : true;
}
function selectorMatchesProperty(entityGroup, property, selector) {
    if (!selector.property) {
        return true;
    }
    return property ? selector.property === propertyString(property) : false;
}
function selectorMatchesDataType(entityGroup, property, selector) {
    if (!selector.data_type) {
        return true;
    }
    return property ? selector.data_type === property.data_type : false;
}
function selectorMatchesAlways(entityGroup, property, selector) {
    return !!selector.always;
}
export class NumberColorMap {
    constructor(config) {
        var _a, _b;
        this.useCache = false;
        this.special = (_a = config === null || config === void 0 ? void 0 : config.special) !== null && _a !== void 0 ? _a : NaN;
        this.specialColor = config.specialColor;
        this.undefined = (_b = config === null || config === void 0 ? void 0 : config.undefined) !== null && _b !== void 0 ? _b : null;
        this.undefinedColor = config.undefinedColor;
        this.values = config.colors.map(c => c[0]);
        this.colors = config.colors.map(c => c[1]);
        this.cache = new Map();
    }
    getValue(value) {
        if (this.useCache) {
            const color = this.cache.get(value);
            if (color) {
                return color;
            }
        }
        const color = this.calculateColor(value);
        if (this.useCache) {
            this.cache.set(value, color);
        }
        return color;
    }
    calculateColor(value) {
        if (this.isSpecial(value))
            return this.specialColor;
        if (this.isUndefined(value))
            return this.undefinedColor;
        if (!this.values.length)
            return this.undefinedColor;
        if (value <= this.values[0])
            return this.colors[0];
        for (let i = this.values.length - 1; i >= 0; i--) {
            if (value >= this.values[i]) {
                return this.colors[i];
            }
        }
        throw new Error('Programming error while calculating color');
    }
    isUndefined(value) {
        if (this.undefined === null || value === null) {
            return this.undefined === value;
        }
        if (isNaN(this.undefined))
            return isNaN(value);
        return this.undefined === value;
    }
    isSpecial(value) {
        if (value === null) {
            return false;
        }
        if (isNaN(this.special))
            return isNaN(value);
        return this.special === value;
    }
}
export class IntColorMap extends NumberColorMap {
    constructor() {
        super(...arguments);
        this.useCache = true;
    }
}
export function colorTripleToHex(color) {
    let rv = '#';
    for (const c of color) {
        if (c !== undefined) {
            rv += ('0' + c.toString(16)).slice(-2);
        }
    }
    return rv;
}
export function hexToColorTriple(hexColor) {
    const match = hexColor
        .toLowerCase()
        .match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/);
    if (!match) {
        throw new Error(`'${hexColor}' is not a valid hexadecimal color`);
    }
    const rv = match.splice(1).map(i => (i ? parseInt(i, 16) : undefined));
    if (rv[3] === undefined) {
        rv.splice(3);
    }
    return rv;
}
