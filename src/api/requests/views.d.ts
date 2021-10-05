import { UUID, View, ViewCrudResponse } from '@/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from '@/api/requests/base.js';
export declare class GetViews extends Request<View[]> {
    scenarioUUID: UUID;
    constructor(scenarioUUID: UUID);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): View[];
}
export declare class GetView extends Request<View> {
    viewUUID: UUID;
    constructor(viewUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
export declare class AddView extends Request<ViewCrudResponse> {
    payload: View;
    scenarioUUID: UUID;
    constructor(scenarioUUID: UUID, payload: View);
    makeRequest(): AxiosRequestConfig;
}
export declare class UpdateView extends Request<ViewCrudResponse> {
    payload: Partial<View>;
    viewUUID: UUID;
    constructor(viewUUID: UUID, payload: Partial<View>);
    makeRequest(): AxiosRequestConfig;
}
export declare class DeleteView extends Request<ViewCrudResponse> {
    viewUUID: UUID;
    constructor(viewUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
