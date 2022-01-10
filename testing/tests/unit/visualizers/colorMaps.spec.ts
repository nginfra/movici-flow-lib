import {
  generateColorSettings,
  hexToColorTriple,
  mergeColorRuleSets,
  NumberColorMap
} from '@movici-flow-common/visualizers/maps/colorMaps';
import baseColorRuleSet from '@movici-flow-common/visualizers/baseColorRuleSet';
import { ColorRuleSet } from '@movici-flow-common/types';

const mapping = new NumberColorMap({
  colors: [
    [0, [0, 0, 0]],
    [1, [255, 255, 255]]
  ],
  special: NaN,
  specialColor: [255, 0, 0],
  undefined: null,
  undefinedColor: [0, 255, 0]
});

describe('colorMaps.ts/NumberColorMap', () => {
  it('returns a color for a number', () => {
    expect(mapping.getValue(0)).toStrictEqual([0, 0, 0]);
  });
  it('returns a color for an in-between number', () => {
    expect(mapping.getValue(0.5)).toStrictEqual([0, 0, 0]);
  });
  it('returns a color for special value', () => {
    expect(mapping.getValue(NaN)).toStrictEqual([255, 0, 0]);
  });
  it('returns a color for undefined value', () => {
    expect(mapping.getValue(null)).toStrictEqual([0, 255, 0]);
  });
  it('returns a color for custom special value', () => {
    expect(
      new NumberColorMap({
        colors: [],
        special: -1,
        specialColor: [255, 0, 0],
        undefined: null,
        undefinedColor: [0, 255, 0]
      }).getValue(-1)
    ).toStrictEqual([255, 0, 0]);
  });
  it('returns a color for custom undefined value', () => {
    expect(
      new NumberColorMap({
        colors: [],
        special: NaN,
        specialColor: [255, 0, 0],
        undefined: -1,
        undefinedColor: [255, 0, 0]
      }).getValue(-1)
    ).toStrictEqual([255, 0, 0]);
  });
});

describe('colorMaps.ts/mergeColorRuleSets', () => {
  const input_1 = { colors: { a: 'a' }, rules: [{ priority: 1, settings: {}, selector: {} }] };

  const input_2 = {
    colors: { b: 'b', a: 'aa' },
    rules: [{ priority: 2, settings: {}, selector: { always: true } }]
  };

  it('returns an empty ruleset when no input is given', () => {
    expect(mergeColorRuleSets()).toStrictEqual({ colors: {}, rules: [] });
  });
  it('return same object for single input', () => {
    expect(mergeColorRuleSets(input_1)).toStrictEqual(input_1);
  });
  it('merges two inputs', () => {
    expect(mergeColorRuleSets(input_1, input_2)).toStrictEqual({
      colors: {
        a: 'aa',
        b: 'b'
      },
      rules: [...input_1.rules, ...input_2.rules]
    });
  });
});

describe('colorMaps.ts/generateColorSettings', () => {
  it('returns color settings for a specific entity/property', () => {
    const entityGroup = 'gas_pipe_entities';
    const property = {
      component: 'operation_status_properties',
      name: 'is_working_properly',
      data_type: 'BOOLEAN',
      description: '',
      unit: ''
    };

    const rules: ColorRuleSet = {
      colors: {},
      rules: [
        {
          priority: 10,
          selector: {
            entity_group: 'gas_pipe_entities'
          },
          settings: {
            baseColor: 'yellow'
          }
        },
        {
          priority: 10,
          selector: {
            property: 'operation_status_properties/is_working_properly'
          },
          settings: {
            colors: [
              [0, 'red'],
              [1, null]
            ]
          }
        }
      ]
    };
    expect(
      generateColorSettings(entityGroup, property, mergeColorRuleSets(baseColorRuleSet, rules))
    ).toStrictEqual({
      baseColor: '#E8B53E',
      colors: [
        [0, '#E54B4B'],
        [1, null]
      ],
      specialColor: '#333333',
      undefinedColor: '#333333'
    });
  });
  it('returns default color settings for an non-matching property', () => {
    const entityGroup = 'gas_pipe_entities';
    const property = {
      component: '',
      name: 'some_property',
      data_type: 'BOOLEAN',
      description: '',
      unit: ''
    };
    const rules: ColorRuleSet = {
      colors: {},
      rules: [
        {
          priority: 10,
          selector: {
            entity_group: 'gas_pipe_entities'
          },
          settings: {
            baseColor: 'yellow'
          }
        }
      ]
    };
    expect(
      generateColorSettings(entityGroup, property, mergeColorRuleSets(baseColorRuleSet, rules))
    ).toStrictEqual({
      baseColor: '#E8B53E',
      colors: [
        [0, '#E54B4B'],
        [1, '#1AB67E']
      ],
      specialColor: '#333333',
      undefinedColor: '#333333'
    });
  });
  it('returns default baseColor for a non-matching entity', () => {
    const entityGroup = 'some_entities';
    const property = {
      component: '',
      name: 'some_property',
      data_type: 'FLOAT',
      description: '',
      unit: ''
    };

    const colors: ColorRuleSet = {
      colors: {},
      rules: []
    };
    expect(
      generateColorSettings(entityGroup, property, mergeColorRuleSets(baseColorRuleSet, colors))
    ).toStrictEqual({
      baseColor: '#777777',
      colors: [[0, null]],
      specialColor: '#333333',
      undefinedColor: '#333333'
    });
  });
  it('throws on missing keys', () => {
    const entityGroup = 'gas_pipe_entities';
    const property = {
      component: '',
      name: 'some_property',
      data_type: 'WEIRD',
      description: '',
      unit: ''
    };

    expect(() =>
      generateColorSettings(entityGroup, property, {
        colors: {},
        rules: []
      })
    ).toThrow('Incomplete Color Map Settings');
  });

  it('returns hexColor when given', () => {
    const entityGroup = 'some_entities';
    const property = {
      component: '',
      name: 'maintenance.under_maintenance',
      data_type: 'BOOLEAN',
      description: '',
      unit: ''
    };
    expect(
      generateColorSettings(entityGroup, property, {
        colors: {},
        rules: [
          {
            priority: 10,
            selector: { always: true },
            settings: {
              baseColor: '#000000',
              colors: [],
              undefinedColor: '#000001',
              specialColor: '#000002'
            }
          }
        ]
      })
    ).toStrictEqual({
      baseColor: '#000000',
      colors: [],
      undefinedColor: '#000001',
      specialColor: '#000002'
    });
  });
});
describe('hexToColorTriple', () => {
  const validHexColors: [string, number[]][] = [
    ['123456', [18, 52, 86]],
    ['FFFFFF', [255, 255, 255]],
    ['ffffff', [255, 255, 255]],
    ['#ffffff', [255, 255, 255]]
  ];
  const invalidHexColors = ['12345', 'FFFFF', '12345g', '-123456', 'invald'];

  validHexColors.forEach(([color, expected]) => {
    it(`converts ${color} to a color triple`, () => {
      expect(hexToColorTriple(color)).toStrictEqual(expected);
    });
  });
  invalidHexColors.forEach(color => {
    it(`throws on invalid hex color ${color}`, () => {
      expect(() => hexToColorTriple(color)).toThrow('not a valid hexadecimal color');
    });
  });
});
