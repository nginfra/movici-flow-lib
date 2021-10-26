import { ComponentProperty, Update, UpdateWithData } from '@/flow/types';
import Backend from '@/flow/api/backend';

export interface DatasetStoreConfig {
  backend: Backend;
  datasetUUID: string;
  scenarioUUID?: string;
}

export class DatasetDownloader {
  backend: Backend;
  datasetUUID: string;
  scenarioUUID: string | null;

  constructor(config: DatasetStoreConfig) {
    this.backend = config.backend;
    this.datasetUUID = config.datasetUUID;
    this.scenarioUUID = config.scenarioUUID ?? null;
  }

  async getInitialData<T>(params: {
    entityGroup: string;
    properties?: ComponentProperty[];
  }): Promise<T> {
    const resp = await this.backend.dataset.getData<T>({
      datasetUUID: this.datasetUUID,
      entityGroup: params.entityGroup,
      properties: params.properties
    });

    const entityData = resp?.data && resp.data[params.entityGroup];

    if (!entityData) {
      throw new Error(`${params.entityGroup} not found in dataset ${this.datasetUUID}`);
    }

    return (entityData as unknown) as T;
  }

  async getDatasetState<T>(params: {
    entityGroup: string;
    properties?: ComponentProperty[];
    timestamp?: number;
  }): Promise<T> {
    if (!this.scenarioUUID) {
      return await this.getInitialData<T>(params);
    }

    const resp = await this.backend.dataset.getState({
      datasetUUID: this.datasetUUID,
      scenarioUUID: this.scenarioUUID,
      entityGroup: params.entityGroup,
      properties: params.properties,
      timestamp: params.timestamp
    });

    const entityData = resp?.data && resp.data[params.entityGroup];

    if (!entityData) {
      throw new Error(`${params.entityGroup} not found in dataset ${this.datasetUUID}`);
    }
    return (entityData as unknown) as T;
  }

  async getUpdateList() {
    if (!this.scenarioUUID) {
      return [];
    }
    const allUpdates = await this.backend.updates.list(this.scenarioUUID);
    if (!allUpdates) {
      throw new Error('Error when downloading updates');
    }
    return allUpdates.filter((upd: Update) => upd.dataset_uuid === this.datasetUUID);
  }

  async getUpdateData(
    update: Update,
    entityGroup: string,
    properties: ComponentProperty[]
  ): Promise<UpdateWithData> {
    const data = await this.backend.updates.get(update.uuid, entityGroup, properties);

    if (!data) {
      throw new Error('Error when downloading updates');
    }

    return data;
  }
}
