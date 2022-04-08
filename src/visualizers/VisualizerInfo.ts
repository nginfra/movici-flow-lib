import StatusTracker from '@movici-flow-common/utils/StatusTracker';
import { FlowVisualizerConfig, FlowVisualizerOptions, VisualizationMode } from '../types';

abstract class BaseVisualizerInfo {
  name: string;
  datasetName: string;
  datasetUUID: string | null;
  scenarioUUID: string | null;
  entityGroup: string;
  mode: VisualizationMode;
  visible: boolean;
  errors: Record<string, string>;
  status?: StatusTracker;

  protected constructor(config?: Partial<BaseVisualizerInfo>) {
    this.datasetName = config?.datasetName ?? '';
    this.datasetUUID = config?.datasetUUID ?? null;
    this.name = config?.name || this.datasetName;
    this.scenarioUUID = config?.scenarioUUID || null;
    this.entityGroup = config?.entityGroup ?? '';
    this.mode = config?.mode ?? VisualizationMode.GEOMETRY;
    this.visible = config?.visible ?? true;

    this.errors = config?.errors || {};
    this.status = config?.status;
  }

  /**
   * `setError` and `unsetError` must be used to set/unset an error for a specific category (`key`).
   * This is necessary to maintain Vue reactivity on the `errors` object. Errors are given a
   * category so that specific parts of the code can manage their specific error by category
   * (eg. `load` for downloading errors, or `content` for when a `VisualizerInfo` object has invalid
   * content
   * @param key: the error category
   * @param value: the error message
   */
  setError(key: string, value: string) {
    this.errors = Object.assign({}, this.errors, { [key]: value });
  }

  /**
   * Unset an error by category (`key`). See also `setError` above
   * @param key: the error category
   */
  unsetError(key: string) {
    delete this.errors[key];
    this.errors = Object.assign({}, this.errors);
  }
}

export class ComposableVisualizerInfo extends BaseVisualizerInfo {
  settings?: FlowVisualizerOptions;
  id: string;
  constructor(config?: Partial<ComposableVisualizerInfo>) {
    super(config);
    this.settings = config?.settings;
    this.id = config?.id ?? randomID();
  }

  toVisualizerConfig(): FlowVisualizerConfig {
    if (!this.settings) throw new Error(`No settings defined for ${this.name}`);
    return {
      name: this.name,
      dataset_name: this.datasetName,
      entity_group: this.entityGroup,
      visible: this.visible,
      settings: this.settings
    };
  }
}

function randomID(): string {
  return Math.random().toString(36);
}
