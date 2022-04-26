import { Layer } from '@deck.gl/core';
import { Coordinate, EntityGroupData, PopupCallback, TopologyLayerData } from '../types';
import { TopologyGetter } from './geometry';
import { DatasetDownloader } from '../utils/DatasetDownloader';
import { ComposableVisualizerInfo } from './VisualizerInfo';
import { TapefileStore } from './TapefileStore';

export interface VisualizerContext {
  datasetStore: DatasetDownloader;
  tapefileStore: TapefileStore;
  onLoad?: () => void;
  onError?: (err: Error) => void;
  info: ComposableVisualizerInfo;
}

export const DIMENSIONS = {
  SIZE: 3.5,
  SIZE_MIN_PIXELS: 2,
  SIZE_MAX_PIXELS: 5,
  ICON_SIZE: 20,
  ICON_SIZE_MIN_PIXELS: 5,
  ICON_SIZE_MAX_PIXELS: 20
};

export abstract class BaseVisualizer<
  EntityData extends EntityGroupData<Coordinate | number>,
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>,
  Layer_ extends Layer<LData>
> {
  datasetStore: DatasetDownloader;
  tapefileStore: TapefileStore;
  info: ComposableVisualizerInfo;
  order: number;
  onClick: PopupCallback;
  onHover: PopupCallback;
  protected topology?: TopologyLayerData<Coord>[];
  protected onLoad?: () => void;
  protected onError?: (err: Error) => void;
  protected loaded: boolean;
  constructor(config: VisualizerContext) {
    this.datasetStore = config.datasetStore;
    this.info = config.info;
    this.onLoad = config.onLoad;
    this.onError = config.onError;
    this.tapefileStore = config.tapefileStore;
    this.order = 0;
    this.loaded = false;
    this.onClick = () => {};
    this.onHover = () => {};
  }

  get baseID(): string {
    return `${this.info.id}`;
  }

  get orderedId(): string {
    return `${this.info.id}-${this.order}`;
  }

  async load(callbacks?: {
    onSuccess?: () => void;
    onError?: (e: Error | unknown) => void;
    onProgress?: (p: number) => void;
  }): Promise<void> {
    if (this.mustReload()) {
      this.info.unsetError('load');
      try {
        await this.doLoad(callbacks?.onProgress);
      } catch (err: unknown) {
        const error = new Error(String(err));
        console.error(error);

        return this.handleError(error, callbacks?.onError);
      } finally {
        this.loaded = true;
      }
      this.handleSuccess(callbacks?.onSuccess);
    }
  }

  mustReload() {
    return !this.loaded;
  }

  setInfo(info: ComposableVisualizerInfo) {
    this.info = info;
  }

  setLayerOrder(order: number) {
    this.order = order;
  }

  setCallbacks(callbacks: { onClick?: PopupCallback; onHover?: PopupCallback }) {
    this.onClick = callbacks.onClick || this.onClick;
    this.onHover = callbacks.onHover || this.onHover;
  }

  private handleSuccess(callback?: () => void) {
    this.onLoad && this.onLoad();
    callback && callback();
  }

  private handleError(err: Error, callback?: (e: Error) => void) {
    this.info.setError('load', err.message);
    if (this.onError) {
      this.onError(err);
    }
    if (callback) {
      callback(err);
    }
  }

  abstract doLoad(onProgress?: (p: number) => void): Promise<void>;
  abstract get topologyGetter(): TopologyGetter<EntityData, Coord>;
  abstract getLayer(timestamp?: number): Layer_ | null;
}
