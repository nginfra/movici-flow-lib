import type { RGBAColor } from "./colors";
import type {
  ByValueColorClause,
  ByValueIconClause,
  FlowVisualizerType,
  LegendOptions,
  StaticColorClause,
  StaticIconClause,
} from "./flowVisualizers";

export class LegendItem {
  title: string;
  icon?: IconShapeLegendItem | null;
  color?: ColorLegendItem | null;

  constructor({ title, icon, color }: Pick<LegendItem, "title" | "icon" | "color">) {
    this.title = title;
    this.icon = icon;
    this.color = color;
  }

  isSimpleLegend() {
    let found = 0;
    const keys: (keyof this)[] = ["icon", "color"];
    for (const key of keys) {
      if (this[key]) {
        found++;
      }
    }
    return found === 1;
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
      this.iconLegends = [["", static_.icon]];
    }
  }
}

export class IconByValueLegendItem extends IconLegendItem {
  constructor(byValue?: ByValueIconClause, legend?: LegendOptions) {
    super({ iconLegends: [] });

    if (byValue && legend?.labels) {
      this.iconLegends = legend.labels.map((label: string, idx: number) => {
        return [label, byValue.icons[idx]![1]] as [string, string];
      });
    }
  }
}

export class ColorLegendItem {
  visualizerType: FlowVisualizerType;
  colorType: "buckets" | "gradient";
  colorLegends: [string, RGBAColor][];

  constructor({ visualizerType, colorType, colorLegends }: ColorLegendItem) {
    this.visualizerType = visualizerType;
    this.colorType = colorType;
    this.colorLegends = colorLegends ?? [];
  }
}

export class ColorByValueLegendItem extends ColorLegendItem {
  constructor(config: ColorLegendItem, byValue: ByValueColorClause, legend: LegendOptions) {
    super(config);

    this.colorLegends =
      legend.labels?.map((label: string, idx: number) => {
        return [label, byValue.colors[idx]![1]] as [string, RGBAColor];
      }) ?? [];
  }
}

export class ColorStaticLegendItem extends ColorLegendItem {
  constructor(config: ColorLegendItem, static_: StaticColorClause) {
    super(config);
    this.colorLegends = [["", static_.color]];
  }
}
