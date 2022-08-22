import { interpolateColorMapping } from '@movici-flow-common/utils/colorUtils';
import { RGBAColor } from '@movici-flow-common/types';

describe('interpolateColorMapping', () => {
  it('trivially return on 0 steps', () => {
    const a: [number, RGBAColor] = [0, [0, 0, 0]];
    const b: [number, RGBAColor] = [1, [100, 100, 100]];
    expect(interpolateColorMapping(a, b, 0)).toStrictEqual([]);
  });
  it('calculates an intermediate value', () => {
    const a: [number, RGBAColor] = [0, [0, 0, 0, 0]];
    const b: [number, RGBAColor] = [1, [100, 100, 100, 100]];
    expect(interpolateColorMapping(a, b, 1)).toStrictEqual([[0.5, [50, 50, 50, 50]]]);
  });
  it('calculates an multiple values', () => {
    const a: [number, RGBAColor] = [0, [0, 0, 0]];
    const b: [number, RGBAColor] = [1, [100, 100, 100]];
    expect(interpolateColorMapping(a, b, 3)).toStrictEqual([
      [0.25, [25, 25, 25]],
      [0.5, [50, 50, 50]],
      [0.75, [75, 75, 75]]
    ]);
  });
  it('rounds colors down to integers', () => {
    const a: [number, RGBAColor] = [0, [0, 0, 0]];
    const b: [number, RGBAColor] = [1, [99, 99, 99]];
    expect(interpolateColorMapping(a, b, 1)).toStrictEqual([[0.5, [49, 49, 49]]]);
  });
  it('assumes full opacity if needed', () => {
    const a: [number, RGBAColor] = [0, [0, 0, 0, 1]];
    const b: [number, RGBAColor] = [1, [100, 100, 100]];
    expect(interpolateColorMapping(a, b, 1)).toStrictEqual([[0.5, [50, 50, 50, 128]]]);
  });
  it('assumes full opacity if needed (right side)', () => {
    const a: [number, RGBAColor] = [0, [0, 0, 0]];
    const b: [number, RGBAColor] = [1, [100, 100, 100, 1]];
    expect(interpolateColorMapping(a, b, 1)).toStrictEqual([[0.5, [50, 50, 50, 128]]]);
  });
  it('works with non-uniform colors', () => {
    const a: [number, RGBAColor] = [0, [85, 113, 242]];
    const b: [number, RGBAColor] = [1, [241, 135, 89]];
    expect(interpolateColorMapping(a, b, 1)).toStrictEqual([[0.5, [163, 124, 165]]]);
  });
});
