import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { BaseRequest } from "./requests";
import { ConcurrencyManager } from "./concurrency";
import upperFirst from "lodash/upperFirst";
import type { IClient } from "../types";

export function hasOwnProperty<O, K extends PropertyKey>(
  obj: O,
  property: K,
): obj is O & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

const API_CONCURRENCY = 10;

export interface ErrorHandlingConfig {
  [k: number]: (e: HTTPErrorPayload) => void;
  http?: (e: HTTPErrorPayload) => void;
  all?: (e: Error | unknown) => void;
}

export interface HTTPErrorPayload {
  status?: number;
  message: string;
}

interface ClientConfig {
  baseURL: string;
  apiToken?: string | null;
  concurrency?: number;
  defaultCallbacks?: ErrorHandlingConfig;
}

export default class Client implements IClient {
  readonly onError: ErrorHandlingConfig;
  baseURL: string;
  apiToken: string | null;
  private readonly http: AxiosInstance;

  constructor(config: ClientConfig) {
    this.baseURL = config.baseURL;
    this.apiToken = config.apiToken || null;
    this.http = axios.create();
    this.onError = config.defaultCallbacks ?? {};
    if (config.concurrency) {
      ConcurrencyManager(this.http, config.concurrency);
    }
  }

  downloadAsFile(data: Blob, filename: string) {
    const url = window.URL.createObjectURL(data);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async request<T>(request: BaseRequest<T>, onError?: ErrorHandlingConfig): Promise<T | null> {
    try {
      const resp = await this.http.request(request.generateConfig(this));
      return request.makeResponse(resp);
    } catch (e) {
      this.handleError(e, onError || {});
      return null;
    }
  }

  handleError(e: Error | unknown, onError: ErrorHandlingConfig): void {
    const handlers: ErrorHandlingConfig = { ...this.onError, ...onError };

    if (axios.isAxiosError(e)) {
      const payload = parseHTTPError(e);
      if (payload.status && handlers[payload.status]) {
        return handlers[payload.status]!(payload);
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
  /**
   * Convert a BaseRequest to a fetch request (uri and options), also injects any required
   * headers
   */
  asFetchRequest(request: BaseRequest<unknown>): { url: string; options: RequestInit } {
    const axiosConfig: Required<AxiosRequestConfig> = request.generateConfig(
      this,
    ) as Required<AxiosRequestConfig>;
    return {
      url: axios.getUri(axiosConfig),
      options: {
        method: axiosConfig.method,
        headers: axiosConfig.headers as Record<string, string>,
        body: axiosConfig.data ? JSON.stringify(axiosConfig.data) : undefined, // assume json body
      },
    };
  }
}

export function defaultClient(settings?: {
  baseURL: string;
  apiToken?: string | null;
  callbacks?: ErrorHandlingConfig;
}): Client {
  return new Client({
    baseURL: settings?.baseURL ?? "/",
    apiToken: settings?.apiToken,
    concurrency: API_CONCURRENCY,
    defaultCallbacks: settings?.callbacks,
  });
}

const HTTP_STATUS_CODES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  500: "Internal Server Error",
  502: "Bad Gateway",
};

function parseHTTPError(err: AxiosError): HTTPErrorPayload {
  let status: number | undefined = undefined,
    message = "";

  if (err.response) {
    status = err.response.status;
    let errMessages: string | Record<string, string> = "";
    if (hasOwnProperty(err.response.data, "message")) {
      errMessages = (err.response.data as { message: string | Record<string, string> }).message;
    }

    if (typeof errMessages !== "string") {
      message = Object.entries(errMessages)
        .map(([key, msg]) => {
          return `${upperFirst(key)}: ${msg}`;
        })
        .join("<br>");
    } else {
      message = errMessages;
    }
  }

  if (!message) {
    const trymessage = status ? HTTP_STATUS_CODES[status] : null;
    message = trymessage ?? "Unknown Error";
  }

  return { status, message };
}
