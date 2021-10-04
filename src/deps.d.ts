/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'reproject' {
  export function reproject(geojson: any, from: any, to: any, projs: any): any;
}

declare module 'axios-concurrency' {
  import { AxiosInstance } from 'axios';

  export function ConcurrencyManager(api: AxiosInstance, MAX_CONCURRENT: number);
}
