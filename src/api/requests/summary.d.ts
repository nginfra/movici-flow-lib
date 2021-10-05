import { AxiosRequestConfig } from 'axios';
import { DatasetSummary, UUID } from '@/types';
import { Request } from '@/api/requests/base.js';
export declare class GetDatasetSummary extends Request<DatasetSummary> {
    datasetUUID: string;
    constructor(datasetUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
export declare class GetScenarioSummary extends Request<DatasetSummary> {
    scenarioUUID: UUID;
    datasetUUID: UUID;
    constructor(scenarioUUID: UUID, datasetUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
export declare class GetUpdateSummary extends Request<DatasetSummary> {
    updateUUID: UUID;
    constructor(updateUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
