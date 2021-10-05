import { Dataset, DatasetWithData } from '@/types/index.js';
import uri, { dataEngineBase } from '@/api/requests/uri.js';
import { Request } from '@/api/requests/base.js';
export class GetDatasets extends Request {
    constructor(projectUUID) {
        super();
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.datasets}`
        };
    }
    makeResponse(resp) {
        return resp.data.datasets.map((d) => new Dataset(d));
    }
}
export class GetDataset extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}`
        };
    }
    makeResponse(resp) {
        return new DatasetWithData(resp.data);
    }
}
export class AddDataset extends Request {
    constructor(projectUUID, dataset) {
        super();
        this.projectUUID = projectUUID;
        this.dataset = dataset;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.datasets}`,
            data: this.dataset
        };
    }
}
export class UpdateDataset extends Request {
    constructor(datasetUUID, dataset) {
        super();
        this.datasetUUID = datasetUUID;
        this.dataset = dataset;
    }
    makeRequest() {
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
export class DeleteDataset extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}`
        };
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GetDatasetData extends Request {
    constructor(datasetUUID, entityGroup, properties) {
        super();
        this.datasetUUID = datasetUUID;
        this.entityGroup = entityGroup;
        this.properties = properties;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.data}`,
            params: getDatasetFilterParams(this.entityGroup, this.properties)
        };
    }
    makeResponse(resp) {
        return new DatasetWithData(resp.data);
    }
}
export class GetDatasetDataAsBlob extends Request {
    constructor(datasetUUID, entityGroup, properties) {
        super();
        this.datasetUUID = datasetUUID;
        this.entityGroup = entityGroup;
        this.properties = properties;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.data}`,
            params: getDatasetFilterParams(this.entityGroup, this.properties),
            responseType: 'blob'
        };
    }
    makeResponse(resp) {
        return {
            data: resp.data,
            contentType: resp.headers['content-type']
        };
    }
}
export class AddDatasetData extends Request {
    constructor(datasetUUID, file, onProgress) {
        super();
        this.datasetUUID = datasetUUID;
        this.file = file;
        this.onProgress = onProgress;
    }
    makeRequest() {
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
export class DeleteDatasetData extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}/data`
        };
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GetScenarioState extends Request {
    constructor(datasetUUID, scenarioUUID, entityGroup, properties, timestamp) {
        super();
        this.datasetUUID = datasetUUID;
        this.scenarioUUID = scenarioUUID;
        this.entityGroup = entityGroup;
        this.properties = properties;
        this.timestamp = timestamp;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.state}`,
            params: this.getStateFilterParams()
        };
    }
    makeResponse(resp) {
        return new DatasetWithData(resp.data);
    }
    getStateFilterParams() {
        const params = getDatasetFilterParams(this.entityGroup, this.properties);
        params.dataset_uuid = this.datasetUUID;
        if (this.timestamp !== undefined) {
            params.timestamp = this.timestamp;
        }
        return params;
    }
}
export function getDatasetFilterParams(entityGroup, properties) {
    if (!entityGroup) {
        return {};
    }
    if (!(properties === null || properties === void 0 ? void 0 : properties.length)) {
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
export class GetDatasetMapThumbnail extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.map}`,
            params: { thumbnail: 'true' },
            responseType: 'arraybuffer'
        };
    }
}
export class GetDatasetMap extends Request {
    constructor(datasetUUID) {
        super();
        this.datasetUUID = datasetUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.datasets}/${this.datasetUUID}${uri.map}`,
            params: { thumbnail: 'false' },
            responseType: 'arraybuffer'
        };
    }
    makeResponse(resp) {
        return {
            data: resp.data,
            contentType: resp.headers['content-type']
        };
    }
}
