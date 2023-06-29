import type { UUID } from "./general";
import type { AxiosProgressEvent, AxiosRequestConfig, AxiosResponse } from "axios";
import type { ErrorHandlingConfig } from "../api/client";
import type { BaseRequest } from "@movici-flow-lib/api";

export type ProgressHandler = (e: AxiosProgressEvent) => void;

export interface IRequest<Resp> {
  generateConfig(client: IClient): AxiosRequestConfig;
  makeResponse(resp: AxiosResponse): Resp;
}
export interface IClient {
  baseURL: string;
  apiToken: string | null;
  request<Resp>(req: IRequest<Resp>, onError?: ErrorHandlingConfig): Promise<Resp | null>;
  asFetchRequest(request: BaseRequest<unknown>): { url: string; options: RequestInit };
}
export interface CrudResponse {
  result: string;
  message: string;
}

export interface ProjectCrudResponse extends CrudResponse {
  project_uuid: UUID;
}

export interface DatasetCrudResponse extends CrudResponse {
  dataset_uuid: UUID;
}

export interface ScenarioCrudResponse extends CrudResponse {
  scenario_uuid: UUID;
}

export interface TimelineCrudResponse extends CrudResponse {
  scenario_uuid: UUID;
}

export interface UpdateCrudResponse extends CrudResponse {
  update_uuid: UUID;
}

export interface DatasetTypeCrudResponse extends CrudResponse {
  dataset_type_uuid: UUID;
}

export interface EntityTypeCrudResponse extends CrudResponse {
  entity_type_uuid: UUID;
}

export interface AttributeTypeCrudResponse extends CrudResponse {
  property_type_uuid: UUID;
}

export interface UserCrudResponse extends CrudResponse {
  user_uuid: UUID;
}

export interface ViewCrudResponse extends CrudResponse {
  view_uuid: UUID;
}

export interface TimelineFilter {
  min_time?: number;
  max_time?: number;
  dataset_uuid?: UUID;
  min_iteration?: number;
  limit?: number;
}

export interface RemoteApplicationSettings {
  ApiAddress: string;
  features?: string[];
  Language: string;
}
