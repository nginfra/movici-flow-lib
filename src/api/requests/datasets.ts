import {
  ComponentProperty,
  Dataset,
  DatasetCrudResponse,
  DatasetWithData,
  UUID
} from '@/flow/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import uri, { dataEngineBase } from '@/flow/api/requests/uri';
import { Request } from '@/flow/api/requests/base';

export interface DatasetFilter {
  properties?: string; // comma separated string
  entity_group?: UUID;
  components?: string; // comma separated string
}
interface ScenarioStateFilter extends DatasetFilter {
  dataset_uuid?: UUID;
  dataset_name?: string;
  timestamp?: number;
}

export class GetDatasets extends Request<Dataset[]> {
  projectUUID: UUID;

  constructor(projectUUID: UUID) {
    super();
    this.projectUUID = projectUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.datasets}`
    };
  }

  makeResponse(resp: AxiosResponse): Dataset[] {
    return resp.data.datasets.map((d: unknown) => new Dataset(d as Partial<Dataset>));
  }
}

export class GetDataset extends Request<Dataset> {
  datasetUUID: UUID;

  constructor(datasetUUID: UUID) {
    super();
    this.datasetUUID = datasetUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}`
    };
  }
  makeResponse(resp: AxiosResponse): Dataset {
    return new DatasetWithData(resp.data as Partial<Dataset>);
  }
}

export class AddDataset extends Request<DatasetCrudResponse> {
  dataset: Dataset;
  projectUUID: UUID;
  constructor(projectUUID: UUID, dataset: Dataset) {
    super();
    this.projectUUID = projectUUID;
    this.dataset = dataset;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'post',
      url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.datasets}`,
      data: this.dataset
    };
  }
}

export class UpdateDataset extends Request<DatasetCrudResponse> {
  datasetUUID: UUID;
  dataset: Dataset;
  constructor(datasetUUID: UUID, dataset: Dataset) {
    super();
    this.datasetUUID = datasetUUID;
    this.dataset = dataset;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'put',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}`,
      data: {
        name: this.dataset.name,
        type: this.dataset.type
      }
    };
  }
}
export class DeleteDataset extends Request<DatasetCrudResponse> {
  datasetUUID: UUID;

  constructor(datasetUUID: UUID) {
    super();
    this.datasetUUID = datasetUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'delete',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}`
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GetDatasetData<T = any> extends Request<DatasetWithData<T>> {
  datasetUUID: string;
  entityGroup?: string;
  properties?: ComponentProperty[];

  constructor(datasetUUID: UUID, entityGroup?: string, properties?: ComponentProperty[]) {
    super();
    this.datasetUUID = datasetUUID;
    this.entityGroup = entityGroup;
    this.properties = properties;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.data}`,
      params: getDatasetFilterParams(this.entityGroup, this.properties)
    };
  }

  makeResponse(resp: AxiosResponse): DatasetWithData<T> {
    return new DatasetWithData(resp.data);
  }
}

export class GetDatasetDataAsBlob extends Request<{ data: Blob; contentType: string }> {
  datasetUUID: string;
  entityGroup?: string;
  properties?: ComponentProperty[];

  constructor(datasetUUID: UUID, entityGroup?: string, properties?: ComponentProperty[]) {
    super();
    this.datasetUUID = datasetUUID;
    this.entityGroup = entityGroup;
    this.properties = properties;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.data}`,
      params: getDatasetFilterParams(this.entityGroup, this.properties),
      responseType: 'blob'
    };
  }
  makeResponse(resp: AxiosResponse): { data: Blob; contentType: string } {
    return {
      data: resp.data,
      contentType: resp.headers['content-type']
    };
  }
}

export class AddDatasetData extends Request<unknown> {
  datasetUUID: UUID;
  file: string | Blob;
  onProgress?: (e: ProgressEvent) => void;
  constructor(datasetUUID: UUID, file: string | Blob, onProgress?: (e: ProgressEvent) => void) {
    super();
    this.datasetUUID = datasetUUID;
    this.file = file;
    this.onProgress = onProgress;
  }

  makeRequest(): AxiosRequestConfig {
    const form = new FormData();
    form.append('data', this.file);

    return {
      method: 'post',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}/data`,
      data: form,
      onUploadProgress: this.onProgress
    };
  }
}

export class DeleteDatasetData extends Request<DatasetCrudResponse> {
  datasetUUID: UUID;

  constructor(datasetUUID: UUID) {
    super();
    this.datasetUUID = datasetUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'delete',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}/data`
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GetScenarioState<T = any> extends Request<DatasetWithData<T>> {
  datasetUUID: UUID;
  scenarioUUID: UUID;
  entityGroup?: string;
  properties?: ComponentProperty[];
  timestamp?: number;

  constructor(
    datasetUUID: UUID,
    scenarioUUID: UUID,
    entityGroup?: string,
    properties?: ComponentProperty[],
    timestamp?: number
  ) {
    super();
    this.datasetUUID = datasetUUID;
    this.scenarioUUID = scenarioUUID;
    this.entityGroup = entityGroup;
    this.properties = properties;
    this.timestamp = timestamp;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.state}`,
      params: this.getStateFilterParams()
    };
  }

  makeResponse(resp: AxiosResponse): DatasetWithData<T> {
    return new DatasetWithData(resp.data);
  }

  getStateFilterParams(): ScenarioStateFilter {
    const params: ScenarioStateFilter = getDatasetFilterParams(this.entityGroup, this.properties);
    params.dataset_uuid = this.datasetUUID;
    if (this.timestamp !== undefined) {
      params.timestamp = this.timestamp;
    }
    return params;
  }
}

export function getDatasetFilterParams(
  entityGroup?: string,
  properties?: ComponentProperty[]
): DatasetFilter {
  if (!entityGroup) {
    return {};
  }

  if (!properties?.length) {
    return {
      entity_group: entityGroup
    };
  }
  const components = new Set();
  const props = new Set();
  properties.forEach(p => {
    if (p.component) {
      components.add(p.component);
    }
    props.add(p.name);
  });
  return {
    entity_group: entityGroup,
    properties: Array.from(props).join(','),
    components: components.size ? Array.from(components).join(',') : undefined
  };
}

export class GetDatasetMapThumbnail extends Request<ArrayBuffer> {
  datasetUUID: UUID;

  constructor(datasetUUID: UUID) {
    super();
    this.datasetUUID = datasetUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.map}`,
      params: { thumbnail: 'true' },
      responseType: 'arraybuffer'
    };
  }
}

export class GetDatasetMap extends Request<{ data: ArrayBuffer; contentType: string }> {
  datasetUUID: UUID;

  constructor(datasetUUID: UUID) {
    super();
    this.datasetUUID = datasetUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.map}`,
      params: { thumbnail: 'false' },
      responseType: 'arraybuffer'
    };
  }

  makeResponse(resp: AxiosResponse): { data: ArrayBuffer; contentType: string } {
    return {
      data: resp.data,
      contentType: resp.headers['content-type']
    };
  }
}
