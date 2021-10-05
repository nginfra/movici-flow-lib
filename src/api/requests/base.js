export class BaseRequest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateConfig(client) {
        return this.makeRequest();
    }
    makeResponse(resp) {
        return resp.data;
    }
}
export class Request extends BaseRequest {
    generateConfig(client) {
        const baseURL = client.baseURL, request = this.makeRequest();
        return {
            baseURL,
            headers: client.apiToken ? { Authorization: client.apiToken } : {},
            ...request
        };
    }
}
