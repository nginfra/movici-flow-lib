import { ComponentProperty, Dataset, DatasetCrudResponse, DatasetWithData, UUID } from '@/types/index.js';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from '@/api/requests/base.js';
export interface DatasetFilter {
    properties?: string;
    entity_group?: UUID;
    components?: string;
}
interface ScenarioStateFilter extends DatasetFilter {
    dataset_uuid?: UUID;
    dataset_name?: string;
    timestamp?: number;
}
export declare class GetDatasets extends Request<Dataset[]> {
    projectUUID: UUID;
    constructor(projectUUID: UUID);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): Dataset[];
}
export declare class GetDataset extends Request<Dataset> {
    datasetUUID: UUID;
    constructor(datasetUUID: UUID);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): Dataset;
}
export declare class AddDataset extends Request<DatasetCrudResponse> {
    dataset: Dataset;
    projectUUID: UUID;
    constructor(projectUUID: UUID, dataset: Dataset);
    makeRequest(): AxiosRequestConfig;
}
export declare class UpdateDataset extends Request<DatasetCrudResponse> {
    datasetUUID: UUID;
    dataset: Dataset;
    constructor(datasetUUID: UUID, dataset: Dataset);
    makeRequest(): AxiosRequestConfig;
}
export declare class DeleteDataset extends Request<DatasetCrudResponse> {
    datasetUUID: UUID;
    constructor(datasetUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
export declare class GetDatasetData<T = any> extends Request<DatasetWithData<T>> {
    datasetUUID: string;
    entityGroup?: string;
    properties?: ComponentProperty[];
    constructor(datasetUUID: UUID, entityGroup?: string, properties?: ComponentProperty[]);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): DatasetWithData<T>;
}
export declare class GetDatasetDataAsBlob extends Request<{
    data: Blob;
    contentType: string;
}> {
    datasetUUID: string;
    entityGroup?: string;
    properties?: ComponentProperty[];
    constructor(datasetUUID: UUID, entityGroup?: string, properties?: ComponentProperty[]);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): {
        data: Blob;
        contentType: string;
    };
}
export declare class AddDatasetData extends Request<unknown> {
    datasetUUID: UUID;
    file: string | Blob;
    onProgress?: (e: ProgressEvent) => void;
    constructor(datasetUUID: UUID, file: string | Blob, onProgress?: (e: ProgressEvent) => void);
    makeRequest(): AxiosRequestConfig;
}
export declare class DeleteDatasetData extends Request<DatasetCrudResponse> {
    datasetUUID: UUID;
    constructor(datasetUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
export declare class GetScenarioState<T = any> extends Request<DatasetWithData<T>> {
    datasetUUID: UUID;
    scenarioUUID: UUID;
    entityGroup?: string;
    properties?: ComponentProperty[];
    timestamp?: number;
    constructor(datasetUUID: UUID, scenarioUUID: UUID, entityGroup?: string, properties?: ComponentProperty[], timestamp?: number);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): DatasetWithData<T>;
    getStateFilterParams(): ScenarioStateFilter;
}
export declare function getDatasetFilterParams(entityGroup?: string, properties?: ComponentProperty[]): DatasetFilter;
export declare class GetDatasetMapThumbnail extends Request<ArrayBuffer> {
    datasetUUID: UUID;
    constructor(datasetUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
export declare class GetDatasetMap extends Request<{
    data: ArrayBuffer;
    contentType: string;
}> {
    datasetUUID: UUID;
    constructor(datasetUUID: UUID);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): {
        data: ArrayBuffer;
        contentType: string;
    };
}
export {};
