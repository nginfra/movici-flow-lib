import axios from 'axios';
import { ConcurrencyManager } from '@/api/concurrency.js';
export default class Client {
    constructor(config) {
        var _a;
        this.baseURL = config.baseURL;
        this.apiToken = config.apiToken || null;
        this.http = axios.create();
        this.onError = (_a = config.defaultCallbacks) !== null && _a !== void 0 ? _a : {};
        if (config.concurrency) {
            ConcurrencyManager(this.http, config.concurrency);
        }
    }
    downloadAsFile(data, filename) {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
    async request(request, onError) {
        try {
            const resp = await this.http.request(request.generateConfig(this));
            return request.makeResponse(resp);
        }
        catch (e) {
            this.handleError(e, onError || {});
            return null;
        }
    }
    handleError(e, onError) {
        const handlers = { ...this.onError, ...onError };
        if (axios.isAxiosError(e)) {
            const payload = parseHTTPError(e);
            if (payload.status && handlers[payload.status]) {
                return handlers[payload.status](payload);
            }
            if (handlers.http) {
                return handlers.http(payload);
            }
        }
        if (handlers.all) {
            return handlers.all(e);
        }
        throw e;
    }
}
const HTTPS_STATUS_CODES = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
    502: 'Bad Gateway'
};
function parseHTTPError(err) {
    let status = undefined;
    let message = '';
    if (err.response) {
        status = err.response.status;
        message = JSON.stringify(err.response.data.message);
    }
    if (!message) {
        message = status ? HTTPS_STATUS_CODES[status] : 'Unknown Error';
    }
    return { status, message };
}
