import { RGBAColor } from '@/flow/src/types/colors';
import { PropertySummary, PropertyType } from '@/flow/src/types/schema';
import { CameraOptions, ITapefile } from '@/flow/src/types/visualization';
import { PickInfo } from '@deck.gl/core/lib/deck';

export enum FlowVisualizerType {
  POINTS = 'points',
  LINES = 'lines',
  POLYGONS = 'polygons',
  ARCS = 'arcs'
  // ICONS = 'icons',
  // HEAT_MAP = 'heat_map'
}

export interface CommonVisualizerOptions {
  type: FlowVisualizerType;
  color?: ColorClause;
  popup?: PopupClause;
  size?: SizeClause;
  visibility?: VisibilityClause;
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

export type FlowVisualizerOptions =
  | PointVisualizerOptions
  | LineVisualizerOptions
  | PolygonVisualizerOptions
  | ArcVisualizerOptions;

export interface LegendOptions {
  title: string;
  labels?: string[];
}
export interface StaticColorClause {
  color: RGBAColor;
}

export interface ByValueColorClause {
  type: 'buckets' | 'gradient';
  attribute: PropertySummary | null; // talk with pelle
  colors: [number, RGBAColor][];
  specialColor?: RGBAColor;
  undefinedColor?: RGBAColor;
  minValue?: number;
  maxValue?: number;
}

export interface ColorClause {
  static?: StaticColorClause;
  byValue?: ByValueColorClause;
  legend?: LegendOptions;
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
  attribute: PropertyType | null;
  sizes: [number, number][]; // [value, sizeInUnits][]
  units: SizeUnits;
  minPixels?: number;
  maxPixels?: number;
}

export interface PopupClause {
  title: string;
  when: 'onClick' | 'onHover';
  position: 'dynamic' | 'static';
  items: PopupItem[];
  show?: boolean;
}

export interface PopupItem {
  name: string;
  attribute: PropertyType;
}

export interface ByValueVisibilityClause {
  attribute: PropertyType;
  mapping: [boolean | number, boolean][];
  toggleOn: boolean; // Show entities when the attribute has this value
}
export interface VisibilityClause {
  byValue: ByValueVisibilityClause;
}

export interface Mapper<In, Out> {
  getValue(input: In): Out;
}

export interface PopupContent<D = unknown> {
  title: string;
  pickInfo: PickInfo<D>;
  position: 'dynamic' | 'static';
  when: 'onClick' | 'onHover';
  index: number;
  items: { name: string; tapefile: ITapefile<unknown>; attribute: PropertyType }[];
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
