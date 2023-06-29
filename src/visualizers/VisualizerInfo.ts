import type StatusTracker from "@movici-flow-lib/utils/StatusTracker";
import type { ChartDataset, ChartOptions } from "chart.js";
import type {
  DatasetSummary,
  FlowChartConfig,
  FlowVisualizerConfig,
  FlowVisualizerOptions,
  RGBAColor,
  ScenarioDataset,
  ShortDataset,
  ShortScenario,
  UUID,
} from "../types";

export abstract class BaseVisualizerInfo {
  id: string;
  errors: Record<string, string>;
  status?: StatusTracker;
  scenarioUUID: string | null;
  protected constructor(config?: Partial<BaseVisualizerInfo>) {
    this.id = config?.id ?? randomID();
    this.errors = config?.errors || {};
    this.status = config?.status;
    this.scenarioUUID = config?.scenarioUUID || null;
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

  abstract resolveDatasets(datasets: Record<string, ScenarioDataset>): void;

  forceReset() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.constructor as any)({
      ...this,
      status: undefined,
      errors: {},
      id: randomID(),
    }) as typeof this;
  }
}

export class ComposableVisualizerInfo extends BaseVisualizerInfo {
  datasetName: string;
  datasetUUID: string | null;

  entityGroup: string;
  additionalEntityGroups?: Record<string, string>;
  visible: boolean;
  name: string;
  settings?: FlowVisualizerOptions;
  summary: DatasetSummary | null;
  constructor(config?: Partial<ComposableVisualizerInfo>) {
    super(config);
    this.datasetName = config?.datasetName ?? "";
    this.datasetUUID = config?.datasetUUID ?? null;
    this.entityGroup = config?.entityGroup ?? "";
    this.additionalEntityGroups = config?.additionalEntityGroups;
    this.visible = config?.visible ?? true;
    this.name = config?.name || this.datasetName;
    this.settings = config?.settings;
    this.summary = config?.summary ?? null;
    this.visible = config?.visible ?? true;
  }

  resolveDatasets(datasets: Record<string, ShortDataset>) {
    this.datasetUUID = getDatasetUUIDOrThrow(this.datasetName, datasets);

    if (this.settings?.floodingGrid) {
      this.settings.floodingGrid.heightMapDatasetUUID = getDatasetUUIDOrThrow(
        this.settings.floodingGrid.heightMapDataset,
        datasets
      );
    }
  }

  static fromVisualizerConfig({
    config,
    datasets,
    scenario,
  }: {
    config: FlowVisualizerConfig;
    datasets: Record<string, string>;
    scenario?: ShortScenario | null;
  }) {
    return new ComposableVisualizerInfo({
      name: config.name,
      datasetName: config.dataset_name,
      datasetUUID: datasets[config.dataset_name],
      scenarioUUID: scenario?.uuid,
      entityGroup: config.entity_group,
      additionalEntityGroups: config.additional_entity_groups,
      visible: config.visible,
      settings: config.settings,
    });
  }

  toVisualizerConfig(): FlowVisualizerConfig {
    if (!this.settings) throw new Error(`No settings defined for ${this.name}`);
    const rv: FlowVisualizerConfig = {
      name: this.name,
      dataset_name: this.datasetName,
      entity_group: this.entityGroup,
      visible: this.visible,
      settings: this.settings,
    };

    if (this.additionalEntityGroups) {
      rv.additional_entity_groups = this.additionalEntityGroups;
    }

    return rv;
  }
}

function randomID(): string {
  return Math.random().toString(36);
}

export class ChartVisualizerInfo extends BaseVisualizerInfo {
  attribute: string;
  items: ChartVisualizerItem[];
  title: string;
  settings: Partial<ChartOptions>;

  constructor(config?: Partial<ChartVisualizerInfo>) {
    super(config);
    this.attribute = config?.attribute ?? "";
    this.items = config?.items ?? [];
    this.title = config?.title ?? "";
    this.settings = config?.settings ?? {};
  }

  addItem(item: ChartVisualizerItem): ChartVisualizerInfo {
    return new ChartVisualizerInfo({ ...this, items: [...this.items, item] });
  }

  resolveDatasets(datasets: Record<string, ScenarioDataset>) {
    for (const item of this.items) {
      item.resolveDatasets(datasets);
    }
  }

  toChartConfig(): FlowChartConfig {
    if (!this.attribute) throw new Error(`No attribute defined for ${this.title}`);
    const rv: FlowChartConfig = {
      title: this.title,
      attribute: this.attribute,
      scenarioUUID: this.scenarioUUID ?? "",
      items: this.items.map((i) => {
        return {
          datasetName: i.datasetName,
          datasetUUID: i.datasetUUID,
          entityGroup: i.entityGroup,
          entityId: i.entityId,
          entityIdx: i.entityIdx,
          attribute: i.attribute,
          name: i.name,
          color: i.color,
          settings: i.settings,
        };
      }),
      settings: this.settings,
    };

    return rv;
  }
}

export class ChartVisualizerItem {
  datasetName: string;
  datasetUUID: string | null;
  entityGroup: string;
  entityId: number;
  entityIdx: number;
  attribute: string;
  name: string;
  color: RGBAColor;
  settings?: Partial<ChartDataset>;

  constructor(config?: Partial<ChartVisualizerItem>) {
    this.datasetName = config?.datasetName ?? "";
    this.datasetUUID = config?.datasetUUID ?? null;
    this.entityGroup = config?.entityGroup ?? "";
    this.entityId = config?.entityId ?? 0;
    this.entityIdx = config?.entityIdx ?? 0;
    this.attribute = config?.attribute ?? "";
    this.name = config?.name ?? "";
    this.color = config?.color ?? [0, 0, 0];
    this.settings = config?.settings ?? {};
  }

  resolveDatasets(datasets: Record<string, ScenarioDataset>) {
    this.datasetUUID = getDatasetUUIDOrThrow(this.datasetName, datasets);
  }
}

function getDatasetUUIDOrThrow(
  datasetName: string,
  datasets: Record<string, ScenarioDataset>
): UUID {
  const dataset = datasets[datasetName];
  if (!dataset) {
    throw new Error(`Unknown dataset '${datasetName}'`);
  }
  return dataset.uuid;
}
