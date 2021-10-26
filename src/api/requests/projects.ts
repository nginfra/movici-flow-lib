import { Project, ProjectCrudResponse, UUID } from '@/flow/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import uri, { dataEngineBase } from '@/flow/api/requests/uri';
import { Request } from '@/flow/api/requests/base';

export class GetProjects extends Request<Project[]> {
  constructor() {
    super();
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.projects}`
    };
  }

  makeResponse(resp: AxiosResponse): Project[] {
    return resp.data.projects as Project[];
  }
}

export class GetProject extends Request<Project> {
  projectUUID: UUID;

  constructor(projectUUID: UUID) {
    super();
    this.projectUUID = projectUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.projects}/${this.projectUUID}`
    };
  }
}

export class AddProject extends Request<ProjectCrudResponse> {
  payload: Partial<Project>;
  constructor(payload: Partial<Project>) {
    super();
    this.payload = payload;
  }

  makeRequest(): AxiosRequestConfig {
    delete this.payload.uuid;
    return {
      method: 'post',
      url: `${dataEngineBase}${uri.projects}`,
      data: this.payload
    };
  }
}

export class UpdateProject extends Request<ProjectCrudResponse> {
  payload: Project;
  projectUUID: UUID;
  constructor(projectUUID: UUID, payload: Project) {
    super();
    this.payload = payload;
    this.projectUUID = projectUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'put',
      url: `${dataEngineBase}${uri.projects}/${this.projectUUID}`,
      data: { display_name: this.payload.display_name }
    };
  }
}

export class DeleteProject extends Request<ProjectCrudResponse> {
  projectUUID: UUID;
  constructor(projectUUID: UUID) {
    super();
    this.projectUUID = projectUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'delete',
      url: `${dataEngineBase}${uri.projects}/${this.projectUUID}`
    };
  }
}
