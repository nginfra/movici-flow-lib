/// <reference types="deck.gl" />
import { Layer } from '@deck.gl/core';
import { Coordinate, EntityGroupData, LayerKind, PopupCallback, TopologyLayerData, VisualizerConfigurationSettings } from '@/types';
import { TopologyGetter } from '@/visualizers/geometry';
import { DatasetDownloader } from '@/utils/DatasetDownloader';
import { AnyVisualizerInfo, ComposableVisualizerInfo, VisualizerInfo } from '@/visualizers/VisualizerInfo';
export interface VisualizerContext {
    datasetStore: DatasetDownloader;
    onLoad?: () => void;
    onError?: (err: Error) => void;
    info: VisualizerInfo | ComposableVisualizerInfo;
}
export declare const DIMENSIONS: {
    SIZE: number;
    SIZE_MIN_PIXELS: number;
    SIZE_MAX_PIXELS: number;
    RADIUS_DEPRECATED: number;
    RADIUS_MIN_PIXELS_DEPRECATED: number;
    RADIUS_MAX_PIXELS_DEPRECATED: number;
    RADIUS_SCALE_DEPRECATED: number;
};
export declare abstract class BaseVisualizer<EntityData extends EntityGroupData<Coordinate | number>, Coord extends Coordinate, LData extends TopologyLayerData<Coord>, Layer_ extends Layer<LData>> {
    datasetStore: DatasetDownloader;
    info: VisualizerInfo | ComposableVisualizerInfo;
    order: number;
    onClick: PopupCallback;
    onHover: PopupCallback;
    protected topology?: TopologyLayerData<Coord>[];
    protected onLoad?: () => void;
    protected onError?: (err: Error) => void;
    protected loaded: boolean;
    constructor(config: VisualizerContext);
    get baseID(): string;
    get kind(): LayerKind;
    get orderedId(): string;
    get priority(): number;
    load(callbacks?: {
        onSuccess?: () => void;
        onError?: (e: Error | unknown) => void;
        onProgress?: (p: number) => void;
    }): Promise<void>;
    mustReload(): boolean;
    settings<T extends VisualizerConfigurationSettings>(): Required<T>;
    setInfo(info: AnyVisualizerInfo): void;
    setLayerOrder(order: number): void;
    setCallbacks(callbacks: {
        onClick?: PopupCallback;
        onHover?: PopupCallback;
    }): void;
    private handleSuccess;
    private handleError;
    abstract doLoad(onProgress?: (p: number) => void): Promise<void>;
    abstract get topologyGetter(): TopologyGetter<EntityData, Coord>;
    abstract getLayer(timestamp?: number): Layer_;
}
