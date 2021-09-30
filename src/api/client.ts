import axios, { AxiosError, AxiosInstance } from 'axios';
import { BaseRequest } from '@/flow/src/api/requests';
import { ConcurrencyManager } from '@/flow/src/api/concurrency';

interface ErrorHandlingConfig {
  [k: number]: (e: HTTPErrorPayload) => void;
  http?: (e: HTTPErrorPayload) => void;
  all?: (e: Error | unknown) => void;
}
interface HTTPErrorPayload {
  status?: number;
  message: string;
}

interface ClientConfig {
  baseURL: string;
  apiToken?: string | null;
  concurrency?: number;
  defaultCallbacks?: ErrorHandlingConfig;
}

export default class Client {
  readonly baseURL: string;
  readonly onError: ErrorHandlingConfig;
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

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
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

const HTTPS_STATUS_CODES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
  502: 'Bad Gateway'
};

function parseHTTPError(err: AxiosError): HTTPErrorPayload {
  let status: number | undefined = undefined;
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
