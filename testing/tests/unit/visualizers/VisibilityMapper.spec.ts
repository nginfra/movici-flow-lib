import { hasOwnProperty } from '@movici-flow-common/utils';
import {
  BooleanMapping,
  VisiblityMapper
} from '@movici-flow-common/visualizers/visualizerModules/VisibilityModule';

describe('VisibilityMapper', () => {
  it.each([
    [[], { staticValue: 1 }],
    [[[true, 1]], { staticValue: 1 }],
    [[[true, 0]], { staticValue: 0 }],
    [
      [
        [true, 0],
        [false, 0]
      ],
      { staticValue: 0 }
    ],
    [
      [
        [true, 1],
        [false, 0]
      ],
      { onValue: true }
    ],
    [
      [
        [true, 0],
        [false, 1]
      ],
      { onValue: false }
    ]
  ] as [BooleanMapping, { staticValue?: number; onValue?: boolean }][])(
    '%p - %p',
    (mapping, expected) => {
      const mapper = new VisiblityMapper(mapping);
      if (hasOwnProperty(expected, 'staticValue')) {
        expect(mapper.staticValue).toStrictEqual(expected.staticValue);
      }
      if (hasOwnProperty(expected, 'onValue')) {
        expect(mapper.onValue).toStrictEqual(expected.onValue);
      }
    }
  );
  it.each([true, false] as boolean[])('gets the right value with onValue %p', onValue => {
    const mapper = new VisiblityMapper([]);
    mapper.onValue = onValue;
    mapper.staticValue = undefined;
    expect(mapper.getValue(Number(!onValue))).toEqual(0);
    expect(mapper.getValue(!onValue)).toEqual(0);
    expect(mapper.getValue(Number(onValue))).toEqual(1);
    expect(mapper.getValue(onValue)).toEqual(1);
  });
  it.each([1, 0] as number[])('gets the right value with static %p', staticValue => {
    const mapper = new VisiblityMapper([]);
    mapper.onValue = undefined;
    mapper.staticValue = staticValue;
    expect(mapper.getValue(0)).toEqual(staticValue);
    expect(mapper.getValue(false)).toEqual(staticValue);
    expect(mapper.getValue(1)).toEqual(staticValue);
    expect(mapper.getValue(true)).toEqual(staticValue);
  });
});
