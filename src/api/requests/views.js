import uri, { dataEngineBase } from '@/api/requests/uri.js';
import { Request } from '@/api/requests/base.js';
export class GetViews extends Request {
    constructor(scenarioUUID) {
        super();
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.views}`
        };
    }
    makeResponse(resp) {
        return resp.data.views;
    }
}
export class GetView extends Request {
    constructor(viewUUID) {
        super();
        this.viewUUID = viewUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${dataEngineBase}${uri.views}/${this.viewUUID}`
        };
    }
}
export class AddView extends Request {
    constructor(scenarioUUID, payload) {
        super();
        this.payload = payload;
        this.scenarioUUID = scenarioUUID;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${dataEngineBase}${uri.scenarios}/${this.scenarioUUID}${uri.views}`,
            data: this.payload
        };
    }
}
export class UpdateView extends Request {
    constructor(viewUUID, payload) {
        super();
        this.payload = payload;
        this.viewUUID = viewUUID;
    }
    makeRequest() {
        return {
            method: 'put',
            url: `${dataEngineBase}${uri.views}/${this.viewUUID}`,
            data: this.payload
        };
    }
}
export class DeleteView extends Request {
    constructor(viewUUID) {
        super();
        this.viewUUID = viewUUID;
    }
    makeRequest() {
        return {
            method: 'delete',
            url: `${dataEngineBase}${uri.views}/${this.viewUUID}`
        };
    }
}
