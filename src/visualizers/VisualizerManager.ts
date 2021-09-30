import { getVisualizer, Visualizer, VisualizerInfo } from '@/flow/src/visualizers/index';
import isEqual from 'lodash/isEqual';
import isError from 'lodash/isError';

import { determineChanges } from '@/flow/src/components/map/mapVisHelpers';
import { DatasetDownloader } from '@/flow/src//utils/DatasetDownloader';
import { AnyVisualizerInfo } from '@/flow/src/visualizers/VisualizerInfo';
import Backend from '@/flow/src/api/backend';

type VMCallback = (params: CallbackPayload) => void;

interface CallbackPayload {
  manager: VisualizerManager;
  info?: AnyVisualizerInfo;
  error?: Error | unknown;
}
type CallbackEvent = 'success' | 'create' | 'delete' | 'error';

/**
 * The VisualizerManager creates and maintains `Visualizers` for the `MapVis.vue` component
 * @param: config:
 *   * backend: A `Client` for accessing the Simulation Engine backend
 *   * onSuccess: A callback (or array of callbacks) that is/are invoked whenever the Visualizers
 *     have been successfully updated to the state required by the given `layerInfos` in
 *     `VisualizerManager.updateVisualizers()`
 *   * onFailure: A callback (or array of callbacks) that is invoked when an uncaught error is
 *     thrown during updating the visualizers. Note: many errors are caught by the process of
 *     updating the visualizers, and these errors are instead stored in the `AnyVisualizerInfo.errors`
 *     dictionary. In these cases, the `onFailure` callbacks are not invoked
 */
export default class VisualizerManager {
  protected backend: Backend;
  protected visualizers: Record<string, Visualizer>;
  private desiredInfos: AnyVisualizerInfo[];
  private currentInfos: AnyVisualizerInfo[];
  protected callbacks: Record<CallbackEvent, VMCallback[]>;
  private loading: boolean;

  constructor(config: {
    backend: Backend;
    onSuccess?: VMCallback | VMCallback[];
    onError?: VMCallback | VMCallback[];
    onCreate?: VMCallback | VMCallback[];
    onDelete?: VMCallback | VMCallback[];
  }) {
    this.backend = config.backend;
    this.visualizers = {};
    this.desiredInfos = [];
    this.currentInfos = [];
    this.loading = false;
    this.callbacks = {
      create: [],
      delete: [],
      success: [],
      error: []
    };
    if (config.onSuccess) this.on('success', config.onSuccess);
    if (config.onError) this.on('error', config.onError);
    if (config.onCreate) this.on('create', config.onCreate);
    if (config.onDelete) this.on('delete', config.onDelete);
  }

  getVisualizers(): Visualizer[] {
    return Object.values(this.visualizers);
  }

  on(event: CallbackEvent, callbacks: VMCallback | VMCallback[]) {
    callbacks = Array.isArray(callbacks) ? callbacks : [callbacks];
    this.callbacks[event].push(...callbacks);
  }

  async updateVisualizers(layerInfos: AnyVisualizerInfo[]): Promise<void> {
    this.desiredInfos = layerInfos;
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

  private async doUpdateVisualizers(layerInfos: AnyVisualizerInfo[]): Promise<void> {
    const [layersToAdd, layersToRemove] = determineChanges(layerInfos, this.currentInfos);
    this.removeVisualizers(layersToRemove);
    this.createVisualizers(layersToAdd);
    layerInfos.forEach((info, idx) => {
      this.visualizers?.[info.id].setInfo(info);
      this.visualizers?.[info.id].setLayerOrder(idx);
    });

    await this.reloadVisualizers();
    this.currentInfos = layerInfos;
  }

  private removeVisualizers(layers: AnyVisualizerInfo[]): void {
    layers.forEach(info => {
      delete this.visualizers[info.id];
      this.invokeCallbacks('delete', { manager: this, info });
    });
  }

  private createVisualizers(layers: AnyVisualizerInfo[]) {
    layers.forEach(info => {
      info.unsetError('create');
      let visualizer: Visualizer;
      try {
        visualizer = this.createVisualizer(info);
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

  private createVisualizer(layerInfo: AnyVisualizerInfo): Visualizer {
    if (layerInfo instanceof VisualizerInfo && !layerInfo.geometry) {
      throw new Error('Layer has no geometry defined');
    }
    if (!layerInfo.datasetUUID) {
      throw new Error(
        `Invalid dataset ${layerInfo.datasetName} for layer ${layerInfo.id}: no UUID`
      );
    }
    const store = new DatasetDownloader({
      backend: this.backend,
      datasetUUID: layerInfo.datasetUUID,
      scenarioUUID: layerInfo.scenarioUUID || undefined
    });
    return getVisualizer({ datasetStore: store, info: layerInfo });
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

  private invokeCallbacks(event: CallbackEvent, payload: CallbackPayload) {
    for (const callback of this.callbacks[event]) {
      try {
        callback(payload);
      } catch (e) {
        console.error(e);
      }
    }
  }
}
