import { RGBAColor } from './colors';
import {
  ByValueColorClause,
  FlowVisualizerType,
  LegendOptions,
  StaticColorClause
} from './flowVisualizers';

export class ColorLegendItem {
  title: string;
  label?: string;
  visualizerType?: FlowVisualizerType;
  colorType: 'buckets' | 'gradient';
  colorLegends: [string, RGBAColor][];

  constructor({ title, label, visualizerType, colorType, colorLegends }: ColorLegendItem) {
    this.title = title;
    this.label = label;
    this.visualizerType = visualizerType;
    this.colorType = colorType;
    this.colorLegends = colorLegends ?? [];
  }
}

export class ColorByValueLegendItem extends ColorLegendItem {
  constructor(config: ColorLegendItem, byValue?: ByValueColorClause, legend?: LegendOptions) {
    super(config);

    if (byValue && legend?.labels) {
      this.colorLegends = legend.labels.map((label: string, idx: number) => {
        return [label, byValue.colors[idx][1]] as [string, RGBAColor];
      });
    }
  }
}

export class ColorStaticLegendItem extends ColorLegendItem {
  constructor(config: ColorLegendItem, static_?: StaticColorClause, legend?: LegendOptions) {
    super(config);

    if (static_ && legend) {
      this.colorLegends = [[legend.title || 'Topology', static_.color]];
    }
  }
}

export type LegendItem = ColorByValueLegendItem | ColorStaticLegendItem;
