import { UUID } from './general';

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

export interface PropertyTypeCrudResponse extends CrudResponse {
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

export interface ApplicationSettings {
  ApiAddress: string;
  features?: string[];
  Language: string;
}
