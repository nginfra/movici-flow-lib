import type { ChartDataset, ChartOptions } from "chart.js";
import type { RGBAColor } from "./colors";

export interface FlowChartConfig {
  title: string;
  attribute: string;
  scenarioUUID: string;
  items: ChartItemConfig[];
  settings: Partial<ChartOptions>;
}

export interface ChartItemConfig {
  datasetName: string;
  datasetUUID: string | null;
  entityGroup: string;
  entityId: number;
  entityIdx: number;
  attribute: string;
  name: string;
  color: RGBAColor;
  settings?: Partial<ChartDataset>;
}
