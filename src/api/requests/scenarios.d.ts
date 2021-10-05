import { Scenario, ScenarioCrudResponse, ShortScenario, TimelineCrudResponse, TimelineInfo, UUID } from '@/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from '@/api/requests/base.js';
export declare class GetScenarios extends Request<ShortScenario[]> {
    projectUUID: UUID;
    constructor(projectUUID: UUID);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): ShortScenario[];
}
export declare class GetScenario extends Request<Scenario> {
    scenarioUUID: UUID;
    constructor(scenarioUUID: UUID);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): Scenario;
}
export declare class AddScenario extends Request<ScenarioCrudResponse> {
    payload: Scenario;
    projectUUID: UUID;
    constructor(projectUUID: UUID, payload: Scenario);
    makeRequest(): AxiosRequestConfig;
}
export declare class UpdateScenario extends Request<ScenarioCrudResponse> {
    payload: Scenario;
    scenarioUUID: UUID;
    constructor(scenarioUUID: UUID, payload: Scenario);
    makeRequest(): AxiosRequestConfig;
}
export declare class DeleteScenario extends Request<ScenarioCrudResponse> {
    scenarioUUID: UUID;
    constructor(scenarioUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
export declare class GetTimelineInfo extends Request<TimelineInfo> {
    scenarioUUID: UUID;
    constructor(scenarioUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
export declare class DeleteTimeline extends Request<TimelineCrudResponse> {
    scenarioUUID: UUID;
    constructor(scenarioUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
