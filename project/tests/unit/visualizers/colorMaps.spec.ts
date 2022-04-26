import { hexToColorTriple, NumberColorMap } from '@movici-flow-common/visualizers/maps/colorMaps';

const mapping = new NumberColorMap({
  colors: [
    [0, [0, 0, 0]],
    [1, [255, 255, 255]]
  ],
  specialColor: [255, 0, 0],
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
    const colorMap = new NumberColorMap({
      colors: [],
      specialColor: [255, 0, 0],
      undefinedColor: [0, 255, 0]
    });
    colorMap.setSpecialValue(-1);
    expect(colorMap.getValue(-1)).toStrictEqual([255, 0, 0]);
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
