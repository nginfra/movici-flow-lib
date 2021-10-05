import Client from '@/api/client';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
export declare abstract class BaseRequest<Resp> {
    abstract makeRequest(): AxiosRequestConfig;
    generateConfig(client: Client): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): Resp;
}
export declare abstract class Request<Resp> extends BaseRequest<Resp> {
    generateConfig(client: Client): AxiosRequestConfig;
}
