import uri, { dataEngineBase } from '@/api/requests/uri.js';
import { Request } from '@/api/requests/base.js';
export class GetProjects extends Request {
    constructor() {
        super();
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.projects}`
        };
    }
    makeResponse(resp) {
        return resp.data.projects;
    }
}
export class GetProject extends Request {
    constructor(projectUUID) {
        super();
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}`
        };
    }
}
export class AddProject extends Request {
    constructor(payload) {
        super();
        this.payload = payload;
    }
    makeRequest() {
        delete this.payload.uuid;
        return {
            method: 'post',
            url: `${dataEngineBase}${uri.projects}`,
            data: this.payload
        };
    }
}
export class UpdateProject extends Request {
    constructor(projectUUID, payload) {
        super();
        this.payload = payload;
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'put',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}`,
            data: { display_name: this.payload.display_name }
        };
    }
}
export class DeleteProject extends Request {
    constructor(projectUUID) {
        super();
        this.projectUUID = projectUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.projects}/${this.projectUUID}`
        };
    }
}
