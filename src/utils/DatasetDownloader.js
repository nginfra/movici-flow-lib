export class DatasetDownloader {
    constructor(config) {
        var _a;
        this.backend = config.backend;
        this.datasetUUID = config.datasetUUID;
        this.scenarioUUID = (_a = config.scenarioUUID) !== null && _a !== void 0 ? _a : null;
    }
    async getInitialData(params) {
        const resp = await this.backend.dataset.getData({
            datasetUUID: this.datasetUUID,
            entityGroup: params.entityGroup,
            properties: params.properties
        });
        const entityData = (resp === null || resp === void 0 ? void 0 : resp.data) && resp.data[params.entityGroup];
        if (!entityData) {
            throw new Error(`${params.entityGroup} not found in dataset ${this.datasetUUID}`);
        }
        return entityData;
    }
    async getDatasetState(params) {
        if (!this.scenarioUUID) {
            return await this.getInitialData(params);
        }
        const resp = await this.backend.dataset.getState({
            datasetUUID: this.datasetUUID,
            scenarioUUID: this.scenarioUUID,
            entityGroup: params.entityGroup,
            properties: params.properties,
            timestamp: params.timestamp
        });
        const entityData = (resp === null || resp === void 0 ? void 0 : resp.data) && resp.data[params.entityGroup];
        if (!entityData) {
            throw new Error(`${params.entityGroup} not found in dataset ${this.datasetUUID}`);
        }
        return entityData;
    }
    async getUpdateList() {
        if (!this.scenarioUUID) {
            return [];
        }
        const allUpdates = await this.backend.updates.list(this.scenarioUUID);
        if (!allUpdates) {
            throw new Error('Error when downloading updates');
        }
        return allUpdates.filter(upd => upd.dataset_uuid === this.datasetUUID);
    }
    async getUpdateData(update, entityGroup, properties) {
        const data = await this.backend.updates.get(update.uuid, entityGroup, properties);
        if (!data) {
            throw new Error('Error when downloading updates');
        }
        return data;
    }
}
