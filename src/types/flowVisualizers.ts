import { RGBAColor } from './colors';
import { PropertySummary } from './schema';
import { CameraOptions } from './visualization';
import { RenderOrderType, UUID } from '.';
import { PopupItem } from './popup';
import { FlowChartConfig } from './charts';

export enum FlowVisualizerType {
  POINTS = 'points',
  LINES = 'lines',
  POLYGONS = 'polygons',
  ARCS = 'arcs',
  ICONS = 'icons',
  GRID = 'grid',
  FLOODING_GRID = 'floodingGrid'
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
  title?: string;
  labels?: string[];
}
export interface StaticColorClause {
  color: RGBAColor;
}

export interface ByValueColorClause {
  type: 'buckets' | 'gradient';
  attribute: PropertySummary | null;
  colors: [number, RGBAColor][];
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
export interface ByValueIconClause {
  attribute: PropertySummary | null;
  icons: [number, string][];
}

export interface SizeClause {
  static?: StaticSizeClause;
  byValue?: ByValueSizeClause;
  dashed?: boolean;
}

type SizeUnits = 'pixels' | 'meters';
export interface StaticSizeClause {
  size: number;
  units: SizeUnits;
  minPixels?: number;
  maxPixels?: number;
}
export interface ByValueSizeClause {
  attribute: PropertySummary | null;
  sizes: [number, number][]; // [value, sizeInUnits][]
  units: SizeUnits;
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

export interface GeometryClause {
  attribute: PropertySummary | null;
}

export interface FloodingGridClause {
  heightMapDataset: string; // filtered select with datasets
  heightMapDatasetUUID?: UUID;
}

export type VisibilityMapping = [boolean | number, boolean][];

export interface ByValueVisibilityClause {
  attribute: PropertySummary;
  mapping: VisibilityMapping;
}
export interface VisibilityClause {
  byValue: ByValueVisibilityClause;
}

export interface Mapper<In, Out> {
  getValue(input: In): Out;
}

export interface View {
  uuid?: string;
  scenario_uuid?: string;
  name: string;
  config: FlowViewConfig;
}

export interface FlowViewConfig {
  version: number;
  visualizers: FlowVisualizerConfig[];
  charts?: FlowChartConfig[];
  camera?: CameraOptions;
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
