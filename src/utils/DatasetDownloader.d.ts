import { ComponentProperty, Update, UpdateWithData } from '@/types';
import Backend from '@/api/backend';
export interface DatasetStoreConfig {
    backend: Backend;
    datasetUUID: string;
    scenarioUUID?: string;
}
export declare class DatasetDownloader {
    backend: Backend;
    datasetUUID: string;
    scenarioUUID: string | null;
    constructor(config: DatasetStoreConfig);
    getInitialData<T>(params: {
        entityGroup: string;
        properties?: ComponentProperty[];
    }): Promise<T>;
    getDatasetState<T>(params: {
        entityGroup: string;
        properties?: ComponentProperty[];
        timestamp?: number;
    }): Promise<T>;
    getUpdateList(): Promise<Update[]>;
    getUpdateData(update: Update, entityGroup: string, properties: ComponentProperty[]): Promise<UpdateWithData>;
}
