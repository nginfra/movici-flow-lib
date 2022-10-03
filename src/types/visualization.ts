import { RGBAColor } from './colors';
import { ComponentProperty } from './schema';
import { Coordinate, TopologyLayerData } from './geometry';
import { LayerProps } from '@deck.gl/core/lib/layer';
import { PopupEventCallback } from './popup';
import { LayerConstructor } from './general';
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
import { BaseVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { FetchRequestOptions } from './backend';
import { ITopologyGetter } from '@movici-flow-common/visualizers/geometry';

import { DeckMouseEvent } from './deck';

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
export type MapOnClickCallback = (input: PickInfo<unknown>, ev?: DeckMouseEvent) => void;

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

export enum LayerKind {
  STATIC_COLOR = 'static_color',
  HEAT_MAP = 'heat_map',
  COLOR_MAP = 'color_map',
  ACTIVE_ENTITY = 'active_entity',
  UNKNOWN = 'unknown'
}

export type ColorMapping = [number, RGBAColor][];
export type AdvColorMapping = [string | number, RGBAColor][];

export interface IVisualizer {
  setInfo(info: BaseVisualizerInfo): void;
  setOrder(ord: number): void;
  baseID: string;
  order: number;
  load(): Promise<void>;
}

export interface IMapVisualizer<Coord extends Coordinate> {
  topologyGetter: ITopologyGetter<Coord>;
  forceRender(): void;
  requestTapefile: (attribute: ComponentProperty, onLoad: (t: ITapefile<unknown>) => void) => void;
  onClick: PopupEventCallback;
  onHover: PopupEventCallback;
  getFetchRequest<T extends keyof FetchRequestOptions>(
    request: T,
    options: FetchRequestOptions[T]
  ): { url: string; options: RequestInit };
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
  specialValue?: T;
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
