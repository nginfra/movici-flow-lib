import { IVisualizer } from '../types';
import { TapefileStore } from './TapefileStore';
import { BaseVisualizerInfo } from './VisualizerInfo';

export interface VisualizerContext<I extends BaseVisualizerInfo> {
  info: I;
  tapefileStore: TapefileStore;
  onLoad?: () => void;
  onError?: (err: Error) => void;
}

export const DIMENSIONS = {
  SIZE: 3.5,
  SIZE_MIN_PIXELS: 2,
  SIZE_MAX_PIXELS: 5,
  ICON_SIZE: 20,
  ICON_SIZE_MIN_PIXELS: 5,
  ICON_SIZE_MAX_PIXELS: 20
};

export abstract class BaseVisualizer<I extends BaseVisualizerInfo> implements IVisualizer {
  tapefileStore: TapefileStore;
  info: I;
  order: number;

  protected onLoad?: () => void;
  protected onError?: (err: Error) => void;
  protected loaded: boolean;
  constructor(config: VisualizerContext<I>) {
    this.info = config.info;
    this.tapefileStore = config.tapefileStore;
    this.onLoad = config.onLoad;
    this.onError = config.onError;
    this.order = 0;
    this.loaded = false;
  }

  get baseID(): string {
    return `${this.info.id}`;
  }

  get orderedId(): string {
    return `${this.info.id}-${this.order}`;
  }

  async load(): Promise<void> {
    if (this.mustReload()) {
      this.info.unsetError('load');
      try {
        await this.doLoad();
      } catch (err: unknown) {
        const error = new Error(String(err));
        console.error(error);

        return this.handleError(error);
      } finally {
        this.loaded = true;
      }
      this.handleSuccess();
    }
  }

  mustReload() {
    return !this.loaded;
  }

  setInfo(info: I) {
    this.info = info;
  }

  setOrder(order: number) {
    this.order = order;
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

  abstract doLoad(): Promise<void>;
}
