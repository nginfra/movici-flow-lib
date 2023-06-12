import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type { IClient } from "@movici-flow-common/types";

export abstract class BaseRequest<Resp> {
  abstract makeRequest(): AxiosRequestConfig;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateConfig(client: IClient): AxiosRequestConfig {
    return this.makeRequest();
  }

  makeResponse(resp: AxiosResponse): Resp {
    return resp.data as unknown as Resp;
  }
}

export abstract class Request<Resp> extends BaseRequest<Resp> {
  generateConfig(client: IClient): AxiosRequestConfig {
    const baseURL = client.baseURL,
      request = this.makeRequest();

    return {
      baseURL,
      headers: client.apiToken ? { Authorization: client.apiToken } : {},
      ...request,
    };
  }
}
