import {
  EntityGeometry,
  FlowVisualizerConfig,
  FlowVisualizerOptions,
  LayerKind,
  PropertyType,
  UUID,
  VisualizationMode,
  VisualizerConfigurationSettings,
  VisualizerViewConfig
} from '@/flow/src/types';
import { hasOwnProperty, propertyString } from '@/flow/src//utils';
import { cleanVisualizerSettings } from '@/flow/src/visualizers/visualizerHelpers';

abstract class BaseVisualizerInfo {
  name: string;
  datasetName: string;
  datasetUUID: string | null;
  scenarioUUID: string | null;
  entityGroup: string;
  mode: VisualizationMode;
  visible: boolean;
  errors: Record<string, string>;
  onProgress?: (p: number) => void;

  protected constructor(config?: Partial<BaseVisualizerInfo>) {
    this.datasetName = config?.datasetName ?? '';
    this.datasetUUID = config?.datasetUUID ?? null;
    this.name = config?.name || this.datasetName;
    this.scenarioUUID = config?.scenarioUUID || null;
    this.entityGroup = config?.entityGroup ?? '';
    this.mode = config?.mode ?? VisualizationMode.GEOMETRY;
    this.visible = config?.visible ?? true;

    this.errors = config?.errors || {};
    this.onProgress = config?.onProgress;
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
export class VisualizerInfo extends BaseVisualizerInfo {
  /**
   * This class contains information about a visualizer. It contains information about what to
   * visualize, such as the datasetName and entityGroup, information specific to the Visualizer
   * (settings) and more contextual information (errors, and an onProgress callback)
   * */
  geometry: EntityGeometry | null;
  settings: VisualizerConfigurationSettings;

  constructor(config?: Partial<VisualizerInfo>) {
    super(config);
    this.geometry = config?.geometry ?? null;
    this.settings = config?.settings ?? { kind: LayerKind.UNKNOWN };
  }

  get id(): string {
    let rv = `${this.settings.kind}-${this.datasetName}/${this.entityGroup}`;
    if (hasOwnProperty(this.settings, 'property') && this.settings.property) {
      rv += '/' + propertyString(this.settings.property as PropertyType);
    }
    if (this.geometry) {
      rv += '-' + this.geometry;
    }

    return rv;
  }

  /**
   * Create a `VisualizerInfo` object from a `VisualizerViewConfig`. This also requires giving the
   * scenario UUID. The `VisualizerInfo` must still be validated for any content errors.
   * @param config: VisualizerViewConfig
   * @param scenarioUUID: A Scenario UUID
   */
  static fromLayerConfig(config: VisualizerViewConfig, scenarioUUID: UUID) {
    return new VisualizerInfo({
      scenarioUUID,
      name: config.name,
      geometry: config.geometry as EntityGeometry,
      datasetName: config.dataset_name,
      entityGroup: config.entity_group,
      mode: config.mode,
      visible: config.visible,
      settings: cleanVisualizerSettings(config.settings)
    });
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

export type AnyVisualizerInfo = VisualizerInfo | ComposableVisualizerInfo;

function randomID(): string {
  return Math.random().toString(36);
}
