import {
  RecalculateMappingValueParams,
  recalculateMappingValues
} from '../src/components/configurators/helpers';

describe('recalculateMappingValues', () => {
  it.each([
    [
      'shrinks values arrays',
      {
        values: [0, 2, 4, 6],
        nSteps: 3
      },
      [0, 3, 6]
    ],
    [
      'grows values arrays',
      {
        values: [0, 1, 2, 6],
        nSteps: 7
      },
      [0, 1, 2, 3, 4, 5, 6]
    ],
    [
      'doesnt recalculate when nSteps remains the same',
      {
        values: [0, 1, 2, 6],
        nSteps: 4
      },
      [0, 1, 2, 6]
    ],
    [
      'doesnt recalculate when nSteps remains the same while supplying min and max value',
      {
        values: [0, 1, 2, 6],
        nSteps: 4,
        minValue: 1,
        maxValue: 2
      },
      [0, 1, 2, 6]
    ],
    [
      'recalculates same size array when forced to do so',
      {
        values: [0, 1, 2, 6],
        nSteps: 4,
        forceRecalculateValues: true
      },
      [0, 2, 4, 6]
    ],

    [
      'recalculates based on max value',
      {
        values: [0, 0.25, 0.5, 0.75],
        nSteps: 2,
        maxValue: 1
      },
      [0, 0.5]
    ],
    [
      'recalculates based on min value',
      {
        values: [0, 0.25, 0.5, 2],
        nSteps: 3,
        minValue: 1
      },
      [1, 1.5, 2]
    ],
    [
      'recalculates based on min and max value',
      {
        values: [0, 0.25, 0.5, 1],
        nSteps: 3,
        minValue: 1,
        maxValue: 2.5
      },
      [1, 1.5, 2]
    ],
    [
      'can use max value as last value',
      {
        values: [0, 0.25, 0.5, 1],
        nSteps: 3,
        maxValueAsLastValue: true,
        maxValue: 2
      },
      [0, 1, 2]
    ],
    [
      'can min and max value when not supplying initial values',
      {
        values: [],
        nSteps: 3,
        minValue: 1,
        maxValue: 3,
        maxValueAsLastValue: true
      },
      [1, 2, 3]
    ]
  ])('%s', (_: string, params: RecalculateMappingValueParams, expected: number[]) => {
    expect(recalculateMappingValues(params)).toStrictEqual(expected);
  });
});
