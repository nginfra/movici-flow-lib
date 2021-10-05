import { ComponentProperty, TimelineFilter, Update, UpdateWithData, UUID } from '@/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from './base';
export declare class GetUpdates extends Request<Update[]> {
    scenarioUUID: string;
    timelineFilter: TimelineFilter;
    constructor(scenarioUUID: UUID, filter?: TimelineFilter);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): Update[];
}
export declare class GetUpdateWithData extends Request<UpdateWithData> {
    updateUUID: UUID;
    entityGroup?: string;
    properties?: ComponentProperty[];
    constructor(updateUUID: UUID, entityGroup?: string, properties?: ComponentProperty[]);
    makeRequest(): AxiosRequestConfig;
}
export declare class GetUpdateAsBlob extends Request<Blob> {
    updateUUID: UUID;
    entityGroup?: string;
    properties?: ComponentProperty[];
    constructor(updateUUID: UUID, entityGroup?: string, properties?: ComponentProperty[]);
    makeRequest(): AxiosRequestConfig;
}
