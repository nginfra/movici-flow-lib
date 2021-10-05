import uri, { dataEngineBase } from '@/api/requests/uri.js';
import { Request } from '@/api/requests/base.js';
export class GetDatasetSummary extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.summary}`
        };
    }
}
export class GetScenarioSummary extends Request {
    constructor(scenarioUUID, datasetUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.summary}`,
            params: {
                dataset_uuid: this.datasetUUID
            }
        };
    }
}
export class GetUpdateSummary extends Request {
    constructor(updateUUID) {
        super();
        this.updateUUID = updateUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.updates}/${this.updateUUID}${uri.summary}`
        };
    }
}
