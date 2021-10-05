import { ComponentProperty, TimelineFilter, Update, UpdateWithData, UUID } from '@/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import uri, { dataEngineBase } from '@/api/requests/uri.js';
import { getDatasetFilterParams } from '@/api/requests/datasets';
import { Request } from './base';

export class GetUpdates extends Request<Update[]> {
  scenarioUUID: string;
  timelineFilter: TimelineFilter;
  constructor(scenarioUUID: UUID, filter?: TimelineFilter) {
    super();
    this.scenarioUUID = scenarioUUID;
    this.timelineFilter = filter ?? {};
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.updates}`,
      params: this.timelineFilter
    };
  }

  makeResponse(resp: AxiosResponse): Update[] {
    return resp.data.updates as Update[];
  }
}

export class GetUpdateWithData extends Request<UpdateWithData> {
  updateUUID: UUID;
  entityGroup?: string;
  properties?: ComponentProperty[];

  constructor(updateUUID: UUID, entityGroup?: string, properties?: ComponentProperty[]) {
    super();
    this.updateUUID = updateUUID;
    this.entityGroup = entityGroup;
    this.properties = properties;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.updates}/${this.updateUUID}`,
      params: getDatasetFilterParams(this.entityGroup, this.properties)
    };
  }
}

export class GetUpdateAsBlob extends Request<Blob> {
  updateUUID: UUID;
  entityGroup?: string;
  properties?: ComponentProperty[];

  constructor(updateUUID: UUID, entityGroup?: string, properties?: ComponentProperty[]) {
    super();
    this.updateUUID = updateUUID;
    this.entityGroup = entityGroup;
    this.properties = properties;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.updates}/${this.updateUUID}`,
      params: getDatasetFilterParams(this.entityGroup, this.properties),
      responseType: 'blob'
    };
  }
}
