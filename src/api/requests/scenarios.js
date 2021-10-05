import uri, { dataEngineBase } from '@/api/requests/uri.js';
import { Request } from '@/api/requests/base.js';
export class GetScenarios extends Request {
    constructor(projectUUID) {
        super();
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.scenarios}`
        };
    }
    makeResponse(resp) {
        return resp.data.scenarios;
    }
}
export class GetScenario extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}`
        };
    }
    makeResponse(resp) {
        const data = resp.data;
        data.has_simulation = data.has_simulation ? data.has_simulation : false;
        return data;
    }
}
export class AddScenario extends Request {
    constructor(projectUUID, payload) {
        super();
        this.payload = payload;
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        delete this.payload.has_simulation;
        return {
            method: 'post',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}${uri.scenarios}`,
            data: this.payload
        };
    }
}
export class UpdateScenario extends Request {
    constructor(scenarioUUID, payload) {
        super();
        this.payload = payload;
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        delete this.payload.has_simulation;
        return {
            method: 'put',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}`,
            data: this.payload
        };
    }
}
export class DeleteScenario extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}`
        };
    }
}
export class GetTimelineInfo extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.timeline}`
        };
    }
}
export class DeleteTimeline extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.timeline}`
        };
    }
}
