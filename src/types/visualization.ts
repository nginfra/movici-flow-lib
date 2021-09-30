import { RGBAColor } from './colors';
import { ComponentProperty, PropertyType } from './schema';
import { Project } from './project';
import { ShortScenario } from './scenarios';
import { SinglePropertyTapefile } from '@/flow/src/visualizers/tapefile';
import { Coordinate, TopologyLayerData } from '@/flow/src/types/geometry';
import { LayerProps } from '@deck.gl/core/lib/layer';
import { PopupContent } from '@/flow/src/types/flowVisualizers';
import { LayerConstructor } from '@/flow/src/types/general';

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
    this.color = config?.color || [0, 0, 0];
  }
}

export class HeatmapLayerSettings {
  kind: LayerKind.HEAT_MAP;
  constructor() {
    this.kind = LayerKind.HEAT_MAP;
  }
}

export type ColorMapping = [number, RGBAColor][];

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
    this.undefinedColor = config?.undefinedColor || [0, 0, 0];
    this.specialColor = config?.specialColor || [0, 0, 0];
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
    this.color = config?.color || [0, 0, 0];
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
export type VisualizableDataTypes = number | boolean;

export interface VisualizerCallbacks {
  requestTapefile: (
    attribute: ComponentProperty,
    onLoad: (t: SinglePropertyTapefile<VisualizableDataTypes>) => void
  ) => void;
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
  moveTo: (time: number) => void;
  copyState: () => T[];
}
