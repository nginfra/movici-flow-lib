import uri, { dataEngineBase } from '@/api/requests/uri.js';
import { getDatasetFilterParams } from '@/api/requests/datasets.js';
import { Request } from './base.js';
export class GetUpdates extends Request {
  constructor(scenarioUUID, filter) {
    super();
    this.scenarioUUID = scenarioUUID;
    this.timelineFilter = filter !== null && filter !== void 0 ? filter : {};
  }
  makeRequest() {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.updates}`,
      params: this.timelineFilter
    };
  }
  makeResponse(resp) {
    return resp.data.updates;
  }
}
export class GetUpdateWithData extends Request {
  constructor(updateUUID, entityGroup, properties) {
    super();
    this.updateUUID = updateUUID;
    this.entityGroup = entityGroup;
    this.properties = properties;
  }
  makeRequest() {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.updates}/${this.updateUUID}`,
      params: getDatasetFilterParams(this.entityGroup, this.properties)
    };
  }
}
export class GetUpdateAsBlob extends Request {
  constructor(updateUUID, entityGroup, properties) {
    super();
    this.updateUUID = updateUUID;
    this.entityGroup = entityGroup;
    this.properties = properties;
  }
  makeRequest() {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.updates}/${this.updateUUID}`,
      params: getDatasetFilterParams(this.entityGroup, this.properties),
      responseType: 'blob'
    };
  }
}
