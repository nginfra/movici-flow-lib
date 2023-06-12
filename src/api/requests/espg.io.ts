import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { BaseRequest } from "./base";

interface GetProjectionResponse {
  results: { proj4: string }[];
  status: string;
}
export class GetEPSGProjection extends BaseRequest<string | null> {
  crs: number | string;
  constructor(crs: number | string) {
    super();
    this.crs = crs;
  }
  makeRequest(): AxiosRequestConfig<GetProjectionResponse> {
    return {
      url: "https://epsg.io/",
      params: {
        q: this.crs,
        format: "json",
      },
    };
  }
  makeResponse(resp: AxiosResponse<GetProjectionResponse>): string | null {
    const data = resp.data;
    if (data.status !== "ok" || !data.results.length) return null;
    return data.results[0].proj4;
  }
}
