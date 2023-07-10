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
  icon?: IconLegendItem | null;
  shape?: IconLegendItem | null;
  color?: ColorLegendItem | null;

  constructor({
    title,
    icon,
    shape,
    color,
  }: Pick<LegendItem, "title" | "icon" | "shape" | "color">) {
    this.title = title;
    this.icon = icon;
    this.shape = shape;
    this.color = color;
  }

  isSimpleLegend() {
    let found = 0;
    const keys: (keyof this)[] = ["icon", "shape", "color"];
    for (const key of keys) {
      if (this[key]) {
        found++;
      }
    }
    return found === 1;
  }

  staticLegendItems(){

  }
}

export class IconLegendItem {
  entries: [string, string][];
  kind: "icon" | "shape";
  constructor({ entries, kind }: IconLegendItem) {
    this.entries = entries;
    this.kind = kind;
  }
}

export class IconStaticLegendItem extends IconLegendItem {
  constructor(clause: StaticIconClause, kind: "icon" | "shape") {
    super({ entries: [["", clause.icon]], kind });
  }
}

export class IconByValueLegendItem extends IconLegendItem {
  constructor(clause: ByValueIconClause, kind: "icon" | "shape", legend?: LegendOptions) {
    super({
      entries: legend?.labels
        ? legend.labels.map((label: string, idx: number) => {
            return [label, clause.icons[idx][1]] as [string, string];
          })
        : [],
      kind,
    });
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
        return [label, byValue.colors[idx][1]] as [string, RGBAColor];
      }) ?? [];
  }
}

export class ColorStaticLegendItem extends ColorLegendItem {
  constructor(config: ColorLegendItem, static_: StaticColorClause) {
    super(config);
    this.colorLegends = [["", static_.color]];
  }
}
