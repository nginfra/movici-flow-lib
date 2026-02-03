import type { RGBAColor } from "./colors";
import type {
  ByValueColorClause,
  ByValueIconClause,
  FlowVisualizerType,
  LegendOptions,
  StaticColorClause,
  StaticIconClause,
} from "./flowVisualizers";

interface StaticLegendItems {
  icon?: IconStaticLegendItem;
  shape?: IconStaticLegendItem;
  color?: ColorStaticLegendItem;
}
export class VisualizerLegend {
  title: string;
  visualizerType: FlowVisualizerType;
  icon?: IconLegendItem | null;
  shape?: IconLegendItem | null;
  color?: ColorLegendItem | null;

  constructor({
    title,
    visualizerType,
    icon,
    shape,
    color,
  }: Pick<VisualizerLegend, "title" | "visualizerType" | "icon" | "shape" | "color">) {
    this.title = title;
    this.visualizerType = visualizerType;
    this.icon = icon;
    this.shape = shape;
    this.color = color;
  }

  isSimpleByValueLegend() {
    let found = 0;
    const keys: (keyof this)[] = ["icon", "shape", "color"];
    for (const key of keys) {
      const clause = this[key] as LegendItem | undefined;

      if (clause?.clauseType === "byValue") {
        found++;
      }
    }
    return found === 1;
  }

  staticLegendItems(): StaticLegendItems {
    return (["icon", "shape", "color"] as (keyof VisualizerLegend)[]).reduce((agg, key) => {
      const clause = this[key] as LegendItem | undefined;
      if (clause?.clauseType === "static") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        agg[key as keyof StaticLegendItems] = clause as any;
      }
      return agg;
    }, {} as Partial<StaticLegendItems>) as StaticLegendItems;
  }
}

export interface LegendItem<T = unknown> {
  clauseType: "static" | "byValue";
  entries: [string, T][];
}

export class IconLegendItem implements LegendItem<string> {
  entries: [string, string][];
  clauseType: "static" | "byValue";
  constructor({ entries, clauseType }: IconLegendItem) {
    this.entries = entries;
    this.clauseType = clauseType;
  }
}

export class IconStaticLegendItem extends IconLegendItem {
  constructor(clause: StaticIconClause) {
    super({ entries: [["", clause.icon]], clauseType: "static" });
  }
  get icon() {
    return this.entries[0]![1];
  }
}

export class IconByValueLegendItem extends IconLegendItem {
  constructor(clause: ByValueIconClause, legend?: LegendOptions) {
    super({
      entries: legend?.labels
        ? legend.labels.map((label: string, idx: number) => {
            return [label, clause.icons[idx]![1]] as [string, string];
          })
        : [],
      clauseType: "byValue",
    });
  }
}

export class ColorLegendItem implements LegendItem<RGBAColor> {
  entries: [string, RGBAColor][];
  clauseType: "static" | "byValue";
  constructor({ entries, clauseType }: ColorLegendItem) {
    this.entries = entries;
    this.clauseType = clauseType;
  }
}
export class ColorStaticLegendItem extends ColorLegendItem {
  constructor(clause: StaticColorClause) {
    super({ entries: [["", clause.color]], clauseType: "static" });
  }
  get color() {
    return this.entries[0]![1];
  }
}
export class ColorByValueLegendItem extends ColorLegendItem {
  colorType: "buckets" | "gradient";
  constructor(
    clause: ByValueColorClause,
    colorType: "buckets" | "gradient",
    legend: LegendOptions,
  ) {
    super({
      entries:
        legend.labels?.map((label: string, idx: number) => {
          return [label, clause.colors[idx]![1]] as [string, RGBAColor];
        }) ?? [],
      clauseType: "byValue",
    });
    this.colorType = colorType;
  }
}
