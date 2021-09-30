import { Layer } from '@deck.gl/core';
import {
  Coordinate,
  EntityGroupData,
  LayerKind,
  PopupCallback,
  TopologyLayerData,
  VisualizerConfigurationSettings
} from '@/flow/src/types';
import { TopologyGetter } from '@/flow/src/visualizers/geometry';
import { DatasetDownloader } from '@/flow/src/utils/DatasetDownloader';
import {
  AnyVisualizerInfo,
  ComposableVisualizerInfo,
  VisualizerInfo
} from '@/flow/src/visualizers/VisualizerInfo';
import { hasOwnProperty } from '@/flow/src/utils';

export interface VisualizerContext {
  datasetStore: DatasetDownloader;
  onLoad?: () => void;
  onError?: (err: Error) => void;
  info: VisualizerInfo | ComposableVisualizerInfo;
}

export const DIMENSIONS = {
  SIZE: 3.5,
  SIZE_MIN_PIXELS: 2,
  SIZE_MAX_PIXELS: 5,
  RADIUS_DEPRECATED: 15,
  RADIUS_MIN_PIXELS_DEPRECATED: 2,
  RADIUS_MAX_PIXELS_DEPRECATED: 10,
  RADIUS_SCALE_DEPRECATED: 2
};

export abstract class BaseVisualizer<
  EntityData extends EntityGroupData<Coordinate | number>,
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>,
  Layer_ extends Layer<LData>
> {
  datasetStore: DatasetDownloader;
  info: VisualizerInfo | ComposableVisualizerInfo;
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
    this.order = 0;
    this.loaded = false;
    this.onClick = () => {};
    this.onHover = () => {};
  }

  get baseID(): string {
    return `${this.info.id}`;
  }

  get kind(): LayerKind {
    if (hasOwnProperty(this.info.settings, 'kind')) {
      return this.info.settings.kind;
    }
    return LayerKind.UNKNOWN;
  }

  get orderedId(): string {
    return `${this.info.id}-${this.order}`;
  }

  get priority(): number {
    const layerOrder = [LayerKind.HEAT_MAP, LayerKind.UNKNOWN];
    return layerOrder.indexOf(this.kind);
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

  settings<T extends VisualizerConfigurationSettings>() {
    return this.info.settings as Required<T>;
  }

  setInfo(info: AnyVisualizerInfo) {
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
  abstract getLayer(timestamp?: number): Layer_;
}
