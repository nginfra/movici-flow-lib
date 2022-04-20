import { RGBAColor } from './colors';
import { ComponentProperty, PropertyType } from './schema';
import { Project } from './project';
import { ShortScenario } from './scenarios';
import { Coordinate, TopologyLayerData } from './geometry';
import { LayerProps } from '@deck.gl/core/lib/layer';
import { PopupContent } from './flowVisualizers';
import { LayerConstructor } from './general';
import {
  DEFAULT_SPECIAL_COLOR_TRIPLE,
  DEFAULT_UNDEFINED_COLOR_TRIPLE
} from '@movici-flow-common/utils/colorUtils';
import {
  ViewMode,
  DrawPolygonMode,
  DrawLineStringMode,
  DrawPointMode,
  TranslateMode,
  TransformMode,
  ModifyMode,
  MeasureDistanceMode,
  MeasureAreaMode,
  MeasureAngleMode
} from '@nebula.gl/edit-modes';
import { PickInfo } from 'deck.gl';

export interface ViewConfig {
  project_name: string;
  scenario_name: string;
  data_layers: VisualizerViewConfig[];
  camera: CameraOptions;
  timestamp?: number;
}

export interface VisualizerViewConfig {
  name?: string;
  geometry?: string;
  dataset_name: string;
  entity_group: string;
  mode?: VisualizationMode;
  visible?: boolean;
  settings: VisualizerConfigurationSettings;
}

export interface CameraOptions {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface FeatureDrawOption {
  id: string;
  title: string;
  order?: number;
  icon: string;
  pack?: string;
  activeColor: string;
  enabled: () => boolean;
  container?: string;
  nebulaMode?: () => NebulaMode;
  modeConfig?: { [key: string]: unknown };
  options?: FeatureDrawOption[];
}

export type CursorCallback = (input: { isHovering: boolean; isDragging: boolean }) => null | string;
export type MapOnClickCallback = (input: PickInfo<unknown>) => void;

export type NebulaMode =
  | DrawLineStringMode
  | DrawPointMode
  | DrawPolygonMode
  | TranslateMode
  | ViewMode
  | TranslateMode
  | TransformMode
  | ModifyMode
  | MeasureDistanceMode
  | MeasureAreaMode
  | MeasureAngleMode;

export enum VisualizationMode {
  GEOMETRY = 'geometry',
  SCENARIO = 'scenario'
}

export enum LayerKind {
  STATIC_COLOR = 'static_color',
  HEAT_MAP = 'heat_map',
  COLOR_MAP = 'color_map',
  ACTIVE_ENTITY = 'active_entity',
  UNKNOWN = 'unknown'
}

export class StaticColorLayerSettings {
  kind: LayerKind.STATIC_COLOR;
  color: RGBAColor;
  constructor(config: Partial<StaticColorLayerSettings>) {
    this.kind = LayerKind.STATIC_COLOR;
    this.color = config?.color || DEFAULT_UNDEFINED_COLOR_TRIPLE;
  }
}

export class HeatmapLayerSettings {
  kind: LayerKind.HEAT_MAP;
  constructor() {
    this.kind = LayerKind.HEAT_MAP;
  }
}

export type ColorMapping = [number, RGBAColor][];
export type AdvColorMapping = [string | number, RGBAColor][];

export class ColorMapLayerSettings {
  kind: LayerKind.COLOR_MAP;
  property?: PropertyType;
  colors: ColorMapping;
  undefinedColor: RGBAColor;
  specialColor: RGBAColor;
  baseColorOverride: RGBAColor | null;
  constructor(config: Partial<ColorMapLayerSettings>) {
    this.kind = LayerKind.COLOR_MAP;
    this.property = config?.property;
    this.colors = config?.colors || [];
    this.undefinedColor = config?.undefinedColor || DEFAULT_UNDEFINED_COLOR_TRIPLE;
    this.specialColor = config?.specialColor || DEFAULT_SPECIAL_COLOR_TRIPLE;
    this.baseColorOverride = config?.baseColorOverride || null;
  }
}

export class ActiveEntityLayerSettings {
  kind: LayerKind.ACTIVE_ENTITY;
  color: RGBAColor;
  inverted: boolean;
  property?: PropertyType;
  onHover?: ComponentProperty;
  constructor(config: Partial<ActiveEntityLayerSettings>) {
    this.kind = LayerKind.ACTIVE_ENTITY;
    this.color = config?.color || DEFAULT_UNDEFINED_COLOR_TRIPLE;
    this.inverted = config?.inverted || false;
    this.property = config?.property;
    this.onHover = config?.onHover;
  }
}

export class UnknownLayerSettings {
  kind: LayerKind.UNKNOWN;
  constructor() {
    this.kind = LayerKind.UNKNOWN;
  }
}

export type VisualizerConfigurationSettings =
  | StaticColorLayerSettings
  | HeatmapLayerSettings
  | UnknownLayerSettings
  | ColorMapLayerSettings
  | ActiveEntityLayerSettings;

export interface VisualizationSettings {
  mode: VisualizationMode;
  project: Project;
  scenario: ShortScenario | null;
}
export type VisualizableDataTypes = unknown;

export interface IVisualizer {
  forceRender(): void;
  requestTapefile: (attribute: ComponentProperty, onLoad: (t: ITapefile<unknown>) => void) => void;
  onClick: (content: PopupContent | null) => void;
  onHover: (content: PopupContent | null) => void;
}

export type LayerParams<
  LData extends TopologyLayerData<Coord>,
  Coord extends Coordinate,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Props extends LayerProps<LData> = any
> = {
  type: LayerConstructor<LData, Props>;
  props: Partial<Props>;
};

export interface ITapefile<T> {
  data: T[];
  specialValue?: T
  moveTo: (time: number) => void;
  copyState: () => T[];
  onSpecialValue: (cb: (val: unknown) => void) => void;
  setSpecialValue: (val: T) => void;
}

export enum RenderOrderType {
  DISABLED = 'disabled',
  NORMAL = 'normal',
  REVERSED = 'reversed'
}
