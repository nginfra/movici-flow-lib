import { RGBAColor } from './colors';
import {
  ByValueColorClause,
  FlowVisualizerType,
  LegendOptions,
  StaticColorClause,
  StaticIconClause
} from './flowVisualizers';

export class LegendItem {
  title: string;
  icon?: IconShapeLegendItem | null;
  color?: ColorLegendItem | null;

  constructor({ title, icon, color }: LegendItem) {
    this.title = title;
    this.icon = icon;
    this.color = color;
  }
}

export type IconShapeLegendItem = {
  icon?: IconLegendItem;
  shape?: IconLegendItem;
};

export class IconLegendItem {
  iconLegends: [string, string][];

  constructor({ iconLegends }: IconLegendItem) {
    this.iconLegends = iconLegends;
  }
}

export class IconStaticLegendItem extends IconLegendItem {
  constructor(static_?: StaticIconClause, legend?: LegendOptions) {
    super({ iconLegends: [] });

    if (static_ && legend) {
      this.iconLegends = [['', static_.icon]];
    }
  }
}

export class ColorLegendItem {
  visualizerType?: FlowVisualizerType;
  colorType: 'buckets' | 'gradient';
  colorLegends: [string, RGBAColor][];

  constructor({ visualizerType, colorType, colorLegends }: ColorLegendItem) {
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
      this.colorLegends = [['', static_.color]];
    }
  }
}
