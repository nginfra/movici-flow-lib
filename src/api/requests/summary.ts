import { AxiosRequestConfig } from 'axios';
import uri, { dataEngineBase } from '@/api/requests/uri.js';
import { DatasetSummary, UUID } from '@/types';
import { Request } from '@/api/requests/base.js';

export class GetDatasetSummary extends Request<DatasetSummary> {
  datasetUUID: string;
  constructor(datasetUUID: UUID) {
    super();
    this.datasetUUID = datasetUUID;
  }
  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.summary}`
    };
  }
}

export class GetScenarioSummary extends Request<DatasetSummary> {
  scenarioUUID: UUID;
  datasetUUID: UUID;
  constructor(scenarioUUID: UUID, datasetUUID: UUID) {
    super();
    this.scenarioUUID = scenarioUUID;
    this.datasetUUID = datasetUUID;
  }
  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.summary}`,
      params: {
        dataset_uuid: this.datasetUUID
      }
    };
  }
}

export class GetUpdateSummary extends Request<DatasetSummary> {
  updateUUID: UUID;
  constructor(updateUUID: UUID) {
    super();
    this.updateUUID = updateUUID;
  }
  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.updates}/${this.updateUUID}${uri.summary}`
    };
  }
}
