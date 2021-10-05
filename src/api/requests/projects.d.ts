import { Project, ProjectCrudResponse, UUID } from '@/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from '@/api/requests/base.js';
export declare class GetProjects extends Request<Project[]> {
    constructor();
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): Project[];
}
export declare class GetProject extends Request<Project> {
    projectUUID: UUID;
    constructor(projectUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
export declare class AddProject extends Request<ProjectCrudResponse> {
    payload: Partial<Project>;
    constructor(payload: Partial<Project>);
    makeRequest(): AxiosRequestConfig;
}
export declare class UpdateProject extends Request<ProjectCrudResponse> {
    payload: Project;
    projectUUID: UUID;
    constructor(projectUUID: UUID, payload: Project);
    makeRequest(): AxiosRequestConfig;
}
export declare class DeleteProject extends Request<ProjectCrudResponse> {
    projectUUID: UUID;
    constructor(projectUUID: UUID);
    makeRequest(): AxiosRequestConfig;
}
