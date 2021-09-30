import { hexToColorTriple } from '@/flow/src/visualizers/maps/colorMaps';

export interface ColorPaletteParams {
  name: string;
  colors: string[];
  colorsForSize: Record<number, number[]>;
  reversed?: boolean;
}

export default class ColorPalette {
  name: string;
  colors: string[];
  colorsForSize: Record<number, number[]>;
  reversed: boolean;

  constructor({ name, colors, colorsForSize, reversed }: ColorPaletteParams) {
    this.name = name;
    this.colors = colors;
    this.colorsForSize = colorsForSize;
    this.reversed = reversed ?? false;
  }

  getHexColorsForSize(size: number) {
    const rv = this.colorsForSize[size].map((n: number) => this.colors[n]);
    if (this.reversed) {
      rv.reverse();
    }
    return rv;
  }

  getColorTriplesForSize(size: number) {
    return this.getHexColorsForSize(size).map(color => hexToColorTriple(color));
  }
}

function addReversedColorPalettes(palettes: Record<string, ColorPalette[]>) {
  for (const [key, arr] of Object.entries(palettes)) {
    const reversed = arr.map(palette => {
      return new ColorPalette({
        name: palette.name + ' (reversed)',
        colors: palette.colors,
        colorsForSize: palette.colorsForSize,
        reversed: true
      });
    });

    palettes[key].push(...reversed);
  }
  return palettes;
}
export const DEFAULT_COLOR_PALETTES = addReversedColorPalettes({
  Sequential: [
    new ColorPalette({
      name: 'Heatmap',
      colors: [
        '#F3E79B',
        '#5C53A5',
        '#EB7F86',
        '#F8A07E',
        '#CE6693',
        '#FAB27F',
        '#B95E9A',
        '#FABC82',
        '#F59280',
        '#DC6F8E',
        '#AB5B9E',
        '#FAC484',
        '#A059A0',
        '#F9C986',
        '#FAAA7F',
        '#F28D81',
        '#E1738B',
        '#C36197',
        '#9858A2'
      ],
      colorsForSize: {
        2: [0, 1],
        3: [0, 2, 1],
        4: [0, 3, 4, 1],
        5: [0, 5, 2, 6, 1],
        6: [0, 7, 8, 9, 10, 1],
        7: [0, 11, 3, 2, 4, 12, 1],
        8: [0, 13, 14, 15, 16, 17, 18, 1]
      }
    }),
    new ColorPalette({
      name: 'Heatmap 2',
      colors: [
        '#F7FEAE',
        '#045275',
        '#46AEA0',
        '#7CCBA2',
        '#089099',
        '#99D9A3',
        '#008093',
        '#ABE1A4',
        '#66C0A1',
        '#259C9C',
        '#00778E',
        '#B7E6A5',
        '#00718B',
        '#C0EAA6',
        '#8DD3A3',
        '#5DBBA1',
        '#2EA19D',
        '#008796',
        '#006C88'
      ],
      colorsForSize: {
        2: [0, 1],
        3: [0, 2, 1],
        4: [0, 3, 4, 1],
        5: [0, 5, 2, 6, 1],
        6: [0, 7, 8, 9, 10, 1],
        7: [0, 11, 3, 2, 4, 12, 1],
        8: [0, 13, 14, 15, 16, 17, 18, 1]
      }
    }),
    new ColorPalette({
      name: 'Traffic Congestion',
      colors: ['#1AB67E', '#E54B4B', '#F19744', '#892D2D'],
      colorsForSize: {
        2: [0, 1],
        3: [0, 2, 1],
        4: [0, 2, 1, 3]
      }
    })
  ],
  Diverging: [
    new ColorPalette({
      name: 'Green - Red',
      colors: [
        '#009392',
        '#CF597E',
        '#E9E29C',
        '#9CCB86',
        '#EEB479',
        '#71BE83',
        '#ED9C72',
        '#52B684',
        '#BCD48C',
        '#EDC783',
        '#EB8D71',
        '#4DAB90',
        '#84C18C',
        '#EEA172',
        '#E57A72'
      ],
      colorsForSize: {
        2: [0, 1],
        3: [0, 2, 1],
        4: [0, 3, 4, 1],
        5: [0, 5, 2, 6, 1],
        6: [0, 7, 8, 9, 10, 1],
        7: [0, 7, 8, 2, 9, 10, 1],
        8: [0, 11, 12, 8, 9, 13, 14, 1]
      }
    }),
    new ColorPalette({
      name: 'Blue - Red',
      colors: [
        '#4962D1',
        '#E54B4B',
        '#F6F6F6',
        '#A9A9E5',
        '#F8A59D',
        '#8D90DF',
        '#C4C2EB',
        '#FAC0BA',
        '#F48980',
        '#7E84DB',
        '#D0CFEE',
        '#FACEC9',
        '#F17B73'
      ],
      colorsForSize: {
        2: [0, 1],
        3: [0, 2, 1],
        4: [0, 3, 4, 1],
        5: [0, 3, 2, 4, 1],
        6: [0, 5, 6, 7, 8, 1],
        7: [0, 5, 6, 2, 7, 8, 1],
        8: [0, 9, 3, 10, 11, 4, 12, 1]
      }
    })
  ],
  'Single Hue': [
    new ColorPalette({
      name: 'Green',
      colors: [
        '#E8F8F2',
        '#48C598',
        '#8FD8BA',
        '#1AB67E',
        '#169B6B',
        '#0D5A3F',
        '#ADE3CD',
        '#70CDA7',
        '#148C61',
        '#159668',
        '#107753',
        '#093E2B'
      ],
      colorsForSize: {
        2: [0, 1],
        3: [0, 2, 3],
        4: [0, 2, 3, 4],
        5: [0, 2, 3, 4, 5],
        6: [0, 6, 7, 3, 8, 5],
        7: [0, 6, 7, 3, 9, 10, 5],
        8: [0, 6, 7, 3, 9, 10, 5, 11]
      }
    }),
    new ColorPalette({
      name: 'Blue',
      colors: [
        '#DDE3FC',
        '#778DF5',
        '#9AAAFA',
        '#5571F2',
        '#445AC2',
        '#334491',
        '#B0BDFB',
        '#8497F8',
        '#4962D1',
        '#3E53B0',
        '#222D61'
      ],
      colorsForSize: {
        2: [0, 1],
        3: [0, 2, 3],
        4: [0, 2, 3, 4],
        5: [0, 2, 3, 4, 5],
        6: [0, 6, 7, 3, 4, 5],
        7: [0, 6, 7, 3, 8, 9, 5],
        8: [0, 6, 7, 3, 8, 9, 5, 10]
      }
    }),
    new ColorPalette({
      name: 'Red',
      colors: [
        '#FADBDB',
        '#EA6F6F',
        '#F09393',
        '#E54B4B',
        '#B73C3C',
        '#892D2D',
        '#F3ABAB',
        '#EC7B7B',
        '#C64141',
        '#A73737',
        '#5C1E1E'
      ],
      colorsForSize: {
        2: [0, 1],
        3: [0, 2, 3],
        4: [0, 2, 3, 4],
        5: [0, 2, 3, 4, 5],
        6: [0, 6, 7, 3, 4, 5],
        7: [0, 6, 7, 3, 8, 9, 5],
        8: [0, 6, 7, 3, 4, 9, 5, 10]
      }
    })
  ],
  Qualitative: [
    new ColorPalette({
      name: 'Stochastic',
      colors: [
        '#1AB67E',
        '#5571F2',
        '#E54B4B',
        '#A258DC',
        '#F18759',
        '#E8B53E',
        '#915135',
        '#9E9E9E'
      ],
      colorsForSize: {
        2: [0, 1],
        3: [0, 1, 2],
        4: [0, 3, 1, 2],
        5: [0, 3, 4, 1, 2],
        6: [0, 3, 4, 1, 5, 2],
        7: [0, 3, 4, 1, 5, 2, 6],
        8: [0, 3, 4, 1, 5, 2, 6, 7]
      }
    })
  ]
});
