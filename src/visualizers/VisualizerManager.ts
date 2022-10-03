import isEqual from 'lodash/isEqual';
import isError from 'lodash/isError';

import { determineChanges } from '../components/map/mapVisHelpers';
import { BaseVisualizerInfo } from './VisualizerInfo';
import { Backend } from '../types/backend';
import { TapefileStoreCollection } from './TapefileStore';
import { IVisualizer } from '@movici-flow-common/types';

type VMCallback<I extends BaseVisualizerInfo, V extends IVisualizer> = (
  params: CallbackPayload<I, V>
) => void;

interface CallbackPayload<I extends BaseVisualizerInfo, V extends IVisualizer> {
  manager: VisualizerManager<I, V>;
  visualizer?: V;
  info?: I;
  error?: Error | unknown;
  timestamp?: number | null;
}
type CallbackEvent = 'success' | 'create' | 'delete' | 'error' | 'data';

/**
 * The VisualizerManager creates and maintains `Visualizers` for the `MapVis.vue` component
 * @param: config:
 *   * backend: A `Client` for accessing the Simulation Engine backend
 *   * onSuccess: A callback (or array of callbacks) that is/are invoked whenever the Visualizers
 *     have been successfully updated to the state required by the given `layerInfos` in
 *     `VisualizerManager.updateVisualizers()`
 *   * onFailure: A callback (or array of callbacks) that is invoked when an uncaught error is
 *     thrown during updating the visualizers. Note: many errors are caught by the process of
 *     updating the visualizers, and these errors are instead stored in the `ComposableVisualizerInfo.errors`
 *     dictionary. In these cases, the `onFailure` callbacks are not invoked
 */
export default class VisualizerManager<I extends BaseVisualizerInfo, V extends IVisualizer> {
  backend: Backend;
  tapefileStores: TapefileStoreCollection;
  protected visualizers: Record<string, V>;
  private desiredInfos: I[];
  private currentInfos: I[];
  protected callbacks: Record<CallbackEvent, VMCallback<I, V>[]>;
  private loading: boolean;
  private createVisualizer: (info: I, manager: VisualizerManager<I, V>) => V;

  constructor(config: {
    backend: Backend;
    tapefileStores: TapefileStoreCollection;
    visualizerFactory: (info: I, manager: VisualizerManager<I, V>) => V;
    onSuccess?: VMCallback<I, V> | VMCallback<I, V>[];
    onError?: VMCallback<I, V> | VMCallback<I, V>[];
    onCreate?: VMCallback<I, V> | VMCallback<I, V>[];
    onDelete?: VMCallback<I, V> | VMCallback<I, V>[];
    onData?: VMCallback<I, V> | VMCallback<I, V>[];
  }) {
    this.backend = config.backend;
    this.visualizers = {};
    this.desiredInfos = [];
    this.currentInfos = [];
    this.loading = false;
    this.tapefileStores = config.tapefileStores;
    this.configureTapefileStoreCallbacks(this.tapefileStores);
    this.createVisualizer = config.visualizerFactory;
    this.callbacks = {
      create: [],
      delete: [],
      success: [],
      error: [],
      data: []
    };
    if (config.onSuccess) this.on('success', config.onSuccess);
    if (config.onError) this.on('error', config.onError);
    if (config.onCreate) this.on('create', config.onCreate);
    if (config.onDelete) this.on('delete', config.onDelete);
    if (config.onData) this.on('data', config.onData);
  }

  private configureTapefileStoreCallbacks(store: TapefileStoreCollection) {
    const cb = (ts: number) => {
      this.invokeCallbacks('data', {
        manager: this,
        timestamp: ts
      });
    };
    store.on('data', cb);
    store.on('ready', cb);
  }

  getVisualizers(): V[] {
    return Object.values(this.visualizers).sort((a, b) => a.order - b.order);
  }

  on(event: CallbackEvent, callbacks: VMCallback<I, V> | VMCallback<I, V>[]) {
    callbacks = Array.isArray(callbacks) ? callbacks : [callbacks];
    this.callbacks[event].push(...callbacks);
  }

  async updateVisualizers(infos: I[]): Promise<void> {
    this.desiredInfos = infos;
    if (this.loading) {
      return;
    }
    this.loading = true;

    // Between runs of `this.doUpdateVisualizers`, `this.desiredInfos` may have changed.
    // We use `this.loading` as a lock, so that only one attempt to update the visualizers
    // is run at the same time. Only after we're done, do we check whether we're still current,
    // or need to update again
    while (!isEqual(this.currentInfos, this.desiredInfos)) {
      const thisInfos = this.desiredInfos;
      try {
        await this.doUpdateVisualizers(thisInfos);
      } catch (e) {
        // After we catch an error, we need to check whether we've tried the latest desired
        // state. If the latest desired state has changed, we may try again. We only call the
        // error callbacks once we're done trying
        if (!isEqual(thisInfos, this.desiredInfos)) {
          continue;
        }
        this.finalize(e);
        return;
      }
    }
    this.finalize();
  }

  private async doUpdateVisualizers(infos: I[]): Promise<void> {
    const [layersToAdd, layersToRemove] = determineChanges(infos, this.currentInfos);
    this.removeVisualizers(layersToRemove);
    this.createVisualizers(layersToAdd);
    infos.forEach((info, idx) => {
      this.visualizers?.[info.id].setInfo(info);
      this.visualizers?.[info.id].setOrder(idx);
    });

    await this.reloadVisualizers();
    this.currentInfos = infos;
  }

  private removeVisualizers(layers: I[]): void {
    layers.forEach(info => {
      delete this.visualizers[info.id];
      this.invokeCallbacks('delete', { manager: this, info });
    });
  }

  private createVisualizers(infos: I[]) {
    infos.forEach(info => {
      info.unsetError('create');
      let visualizer: V;
      try {
        visualizer = this.createVisualizer(info, this);
      } catch (e) {
        if (isError(e)) {
          info.setError('create', e.message);
        }
        console.error(e);
        return;
      }
      if (visualizer) {
        this.visualizers[visualizer.baseID] = visualizer;
        this.invokeCallbacks('create', { manager: this, info });
      }
    });
  }

  private async reloadVisualizers(): Promise<void[]> {
    return await Promise.all(Object.values(this.visualizers).map(viz => viz.load()));
  }

  private finalize(error?: unknown) {
    if (error) {
      this.invokeCallbacks('error', { manager: this, error });
    } else {
      this.invokeCallbacks('success', { manager: this });
    }
    this.loading = false;
  }

  private invokeCallbacks(event: CallbackEvent, payload: CallbackPayload<I, V>) {
    for (const callback of this.callbacks[event]) {
      try {
        callback(payload);
      } catch (e) {
        console.error(e);
      }
    }
  }
}
