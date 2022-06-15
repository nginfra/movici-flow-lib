import { RGBAColor } from './colors';
import { PropertySummary, PropertyType } from './schema';
import { CameraOptions, ITapefile } from './visualization';
import { PickInfo } from '@deck.gl/core/lib/deck';
import { RenderOrderType } from '.';

export enum FlowVisualizerType {
  POINTS = 'points',
  LINES = 'lines',
  POLYGONS = 'polygons',
  ARCS = 'arcs',
  ICONS = 'icons'
}

export interface CommonVisualizerOptions {
  type: FlowVisualizerType;
  color?: ColorClause;
  popup?: PopupClause;
  size?: SizeClause;
  visibility?: VisibilityClause;
  icon?: IconClause;
  shape?: IconClause;
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

export type FlowVisualizerOptions =
  | PointVisualizerOptions
  | LineVisualizerOptions
  | PolygonVisualizerOptions
  | ArcVisualizerOptions
  | IconVisualizerOptions;

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
  minValue?: number;
  maxValue?: number;
}

export interface AdvancedColorSettings {
  fillOpacity?: number;
  renderOrder?: RenderOrderType;
  specialColor: RGBAColor;
  undefinedColor: RGBAColor;
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
  icons: [string, string][];
}

export interface SizeClause {
  static?: StaticSizeClause;
  byValue?: ByValueSizeClause;
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
  when: 'onClick' | 'onHover';
  show?: boolean;
  dynamicTitle?: boolean;
  position: 'dynamic' | 'static';
  items: PopupItem[];
}

export interface PopupItem {
  name: string;
  attribute: PropertyType;
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

export interface PopupContent<D = unknown> {
  title: string;
  dynamicTitle?: boolean;
  pickInfo: PickInfo<D>;
  position: 'dynamic' | 'static';
  when: 'onClick' | 'onHover';
  index: number;
  items: PopupContentItem[];
}

export interface PopupContentItem extends PopupItem {
  tapefile: ITapefile<unknown>;
  enum?: string[];
}

export type PopupCallback = (content: PopupContent | null) => void;

export interface View {
  uuid?: string;
  scenario_uuid?: string;
  name: string;
  config: FlowViewConfig;
}

export interface FlowViewConfig {
  version: number;
  visualizers: FlowVisualizerConfig[];
  camera?: CameraOptions;
  timestamp?: number;
}

export interface FlowVisualizerConfig {
  name: string;
  dataset_name: string;
  entity_group: string;
  visible?: boolean;
  settings: FlowVisualizerOptions;
}
