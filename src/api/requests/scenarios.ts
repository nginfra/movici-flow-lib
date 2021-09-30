import {
  Scenario,
  ScenarioCrudResponse,
  ShortScenario,
  TimelineCrudResponse,
  TimelineInfo,
  UUID
} from '@/flow/src/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import uri, { dataEngineBase } from '@/flow/src/api/requests/uri';
import { Request } from '@/flow/src/api/requests/base';

export class GetScenarios extends Request<ShortScenario[]> {
  projectUUID: UUID;

  constructor(projectUUID: UUID) {
    super();
    this.projectUUID = projectUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.scenarios}`
    };
  }

  makeResponse(resp: AxiosResponse): ShortScenario[] {
    return resp.data.scenarios;
  }
}

export class GetScenario extends Request<Scenario> {
  scenarioUUID: UUID;

  constructor(scenarioUUID: UUID) {
    super();
    this.scenarioUUID = scenarioUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}`
    };
  }

  makeResponse(resp: AxiosResponse): Scenario {
    const data = resp.data;
    data.has_simulation = data.has_simulation ? data.has_simulation : false;

    return (data as unknown) as Scenario;
  }
}

export class AddScenario extends Request<ScenarioCrudResponse> {
  payload: Scenario;
  projectUUID: UUID;
  constructor(projectUUID: UUID, payload: Scenario) {
    super();
    this.payload = payload;
    this.projectUUID = projectUUID;
  }

  makeRequest(): AxiosRequestConfig {
    delete this.payload.has_simulation;

    return {
      method: 'post',
      url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.scenarios}`,
      data: this.payload
    };
  }
}

export class UpdateScenario extends Request<ScenarioCrudResponse> {
  payload: Scenario;
  scenarioUUID: UUID;
  constructor(scenarioUUID: UUID, payload: Scenario) {
    super();
    this.payload = payload;
    this.scenarioUUID = scenarioUUID;
  }

  makeRequest(): AxiosRequestConfig {
    delete this.payload.has_simulation;

    return {
      method: 'put',
      url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}`,
      data: this.payload
    };
  }
}

export class DeleteScenario extends Request<ScenarioCrudResponse> {
  scenarioUUID: UUID;
  constructor(scenarioUUID: UUID) {
    super();
    this.scenarioUUID = scenarioUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'delete',
      url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}`
    };
  }
}

export class GetTimelineInfo extends Request<TimelineInfo> {
  scenarioUUID: UUID;

  constructor(scenarioUUID: UUID) {
    super();
    this.scenarioUUID = scenarioUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.timeline}`
    };
  }
}

export class DeleteTimeline extends Request<TimelineCrudResponse> {
  scenarioUUID: UUID;

  constructor(scenarioUUID: UUID) {
    super();
    this.scenarioUUID = scenarioUUID;
  }

  makeRequest(): AxiosRequestConfig {
    return {
      method: 'delete',
      url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.timeline}`
    };
  }
}
