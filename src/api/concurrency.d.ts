import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
interface RequestHandler {
    request: AxiosRequestConfig;
    resolver: any;
}
export declare const ConcurrencyManager: (axios: AxiosInstance, MAX_CONCURRENT?: number) => {
    queue: RequestHandler[];
    running: RequestHandler[];
    shiftInitial: () => void;
    push: (reqHandler: RequestHandler) => void;
    shift: () => void;
    requestHandler: (req: AxiosRequestConfig) => Promise<AxiosRequestConfig>;
    responseHandler: (res: AxiosResponse) => AxiosResponse<any>;
    responseErrorHandler: (res: AxiosResponse) => Promise<never>;
    interceptors: {
        request: number;
        response: number;
    };
    detach: () => void;
};
export {};
