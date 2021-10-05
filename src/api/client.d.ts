import { BaseRequest } from '@/api/requests';
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
    private readonly http;
    constructor(config: ClientConfig);
    downloadAsFile(data: Blob, filename: string): void;
    request<T>(request: BaseRequest<T>, onError?: ErrorHandlingConfig): Promise<T | null>;
    handleError(e: Error | unknown, onError: ErrorHandlingConfig): void;
}
export {};
