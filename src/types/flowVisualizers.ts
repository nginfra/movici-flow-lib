import type { RGBAColor } from "./colors";
import type { AttributeSummary } from "./schema";
import type { ViewState } from "./visualization";
import type { RenderOrderType, UUID } from ".";
import type { PopupItem } from "./popup";
import type { FlowChartConfig } from "./charts";

export enum FlowVisualizerType {
  POINTS = "points",
  LINES = "lines",
  POLYGONS = "polygons",
  ARCS = "arcs",
  ICONS = "icons",
  GRID = "grid",
  FLOODING_GRID = "floodingGrid",
}

export interface CommonVisualizerOptions {
  type: FlowVisualizerType;
  color?: ColorClause;
  popup?: PopupClause;
  size?: SizeClause;
  visibility?: VisibilityClause;
  icon?: IconClause;
  shape?: IconClause;
  floodingGrid?: FloodingGridClause;
}

export interface PointVisualizerOptions extends CommonVisualizerOptions {
  type: FlowVisualizerType.POINTS;
}

export interface LineVisualizerOptions extends CommonVisualizerOptions {
  type: FlowVisualizerType.LINES;
}

export interface PolygonVisualizerOptions extends CommonVisualizerOptions {
  type: FlowVisualizerType.POLYGONS;
}

export interface ArcVisualizerOptions extends CommonVisualizerOptions {
  type: FlowVisualizerType.ARCS;
}

export interface IconVisualizerOptions extends CommonVisualizerOptions {
  type: FlowVisualizerType.ICONS;
}
export interface GridVisualizerOptions extends CommonVisualizerOptions {
  type: FlowVisualizerType.GRID;
}
export interface FloodingGridVisualizerOptions extends CommonVisualizerOptions {
  type: FlowVisualizerType.FLOODING_GRID;
}

export type FlowVisualizerOptions =
  | PointVisualizerOptions
  | LineVisualizerOptions
  | PolygonVisualizerOptions
  | ArcVisualizerOptions
  | IconVisualizerOptions
  | GridVisualizerOptions
  | FloodingGridVisualizerOptions;

export interface LegendOptions {
  labels?: string[];
}
export interface ByValueClause {
  attribute: AttributeSummary | null;
}
type ValueMapping<T> = [number, T][];
export interface StaticColorClause {
  color: RGBAColor;
}

export interface ByValueColorClause extends ByValueClause {
  type: "buckets" | "gradient";
  colors: ValueMapping<RGBAColor>;
  maxValue?: number;
  semiTransparent?: boolean;
}

export interface AdvancedColorSettings {
  fillOpacity?: number;
  renderOrder?: RenderOrderType;
  specialColor?: RGBAColor;
  undefinedColor?: RGBAColor;
  legend?: LegendOptions;
}

export interface ColorClause {
  static?: StaticColorClause;
  byValue?: ByValueColorClause;
  legend?: LegendOptions;
  advanced?: AdvancedColorSettings;
}

export interface IconClause {
  static?: StaticIconClause;
  byValue?: ByValueIconClause;
  legend?: LegendOptions;
}

export interface StaticIconClause {
  icon: string;
}
export interface ByValueIconClause extends ByValueClause {
  icons: ValueMapping<string>;
}

export interface SizeClause {
  static?: StaticSizeClause;
  byValue?: ByValueSizeClause;
  dashed?: boolean;
}

export type SizeUnit = "pixels" | "meters";
export interface StaticSizeClause {
  size: number;
  units: SizeUnit;
  minPixels?: number;
  maxPixels?: number;
}
export interface ByValueSizeClause extends ByValueClause {
  sizes: ValueMapping<number>;
  units: SizeUnit;
  minPixels?: number;
  maxPixels?: number;
}

export interface PopupClause {
  title: string;
  show?: boolean;
  onHover?: boolean;
  dynamicTitle?: boolean;
  items: PopupItem[];
}

export interface FloodingGridClause {
  heightMapDataset: string;
  heightMapDatasetUUID?: UUID;
}

export interface ByValueVisibilityClause extends ByValueClause {
  mapping: ValueMapping<boolean>;
  maxValue?: number;
}
export interface VisibilityClause {
  byValue: ByValueVisibilityClause;
}

export interface Mapper<In, Out> {
  getValue(input: In): Out;
}

export interface ViewPayload {
  name: string;
  config: FlowViewConfig;
}
export interface View extends ViewPayload {
  uuid: string;
  scenario_uuid: string;
}

export interface FlowViewConfig {
  version: number;
  visualizers: FlowVisualizerConfig[];
  charts?: FlowChartConfig[];
  camera?: ViewState;
  timestamp?: number;
}

export interface FlowVisualizerConfig {
  name: string;
  dataset_name: string;
  entity_group: string;
  additional_entity_groups?: Record<string, string>;
  visible?: boolean;
  settings: FlowVisualizerOptions;
}
