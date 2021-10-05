/// <reference types="deck.gl" />
import { RGBAColor } from './colors';
import { ComponentProperty, PropertyType } from './schema';
import { Project } from './project';
import { ShortScenario } from './scenarios';
import { SinglePropertyTapefile } from '@/visualizers/tapefile';
import { Coordinate, TopologyLayerData } from '@/types/geometry';
import { LayerProps } from '@deck.gl/core/lib/layer';
import { PopupContent } from '@/types/flowVisualizers';
import { LayerConstructor } from '@/types/general';
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
export declare enum VisualizationMode {
    GEOMETRY = "geometry",
    SCENARIO = "scenario"
}
export declare enum LayerKind {
    STATIC_COLOR = "static_color",
    HEAT_MAP = "heat_map",
    COLOR_MAP = "color_map",
    ACTIVE_ENTITY = "active_entity",
    UNKNOWN = "unknown"
}
export declare class StaticColorLayerSettings {
    kind: LayerKind.STATIC_COLOR;
    color: RGBAColor;
    constructor(config: Partial<StaticColorLayerSettings>);
}
export declare class HeatmapLayerSettings {
    kind: LayerKind.HEAT_MAP;
    constructor();
}
export declare type ColorMapping = [number, RGBAColor][];
export declare class ColorMapLayerSettings {
    kind: LayerKind.COLOR_MAP;
    property?: PropertyType;
    colors: ColorMapping;
    undefinedColor: RGBAColor;
    specialColor: RGBAColor;
    baseColorOverride: RGBAColor | null;
    constructor(config: Partial<ColorMapLayerSettings>);
}
export declare class ActiveEntityLayerSettings {
    kind: LayerKind.ACTIVE_ENTITY;
    color: RGBAColor;
    inverted: boolean;
    property?: PropertyType;
    onHover?: ComponentProperty;
    constructor(config: Partial<ActiveEntityLayerSettings>);
}
export declare class UnknownLayerSettings {
    kind: LayerKind.UNKNOWN;
    constructor();
}
export declare type VisualizerConfigurationSettings = StaticColorLayerSettings | HeatmapLayerSettings | UnknownLayerSettings | ColorMapLayerSettings | ActiveEntityLayerSettings;
export interface VisualizationSettings {
    mode: VisualizationMode;
    project: Project;
    scenario: ShortScenario | null;
}
export declare type VisualizableDataTypes = number | boolean;
export interface VisualizerCallbacks {
    requestTapefile: (attribute: ComponentProperty, onLoad: (t: SinglePropertyTapefile<VisualizableDataTypes>) => void) => void;
    onClick: (content: PopupContent | null) => void;
    onHover: (content: PopupContent | null) => void;
}
export declare type LayerParams<LData extends TopologyLayerData<Coord>, Coord extends Coordinate, Props extends LayerProps<LData> = any> = {
    type: LayerConstructor<LData, Props>;
    props: Partial<Props>;
};
export interface ITapefile<T> {
    data: T[];
    moveTo: (time: number) => void;
    copyState: () => T[];
}
