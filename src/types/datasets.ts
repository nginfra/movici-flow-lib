import { Line3DCoordinate, LineCoordinate, PolygonCoordinate } from './geometry';
import { UUID } from './general';

export interface DatasetCollection {
  datasets: Dataset[];
}

export class Dataset {
  name: string;
  display_name?: string | null;
  uuid: UUID;
  type: string;
  has_data: boolean;
  status: string;
  created_on?: number;
  last_modified?: number;
  general?: GeneralSection;
  constructor(config?: Partial<Dataset>) {
    this.name = config?.name ?? 'unknown_dataset';
    this.display_name = config?.display_name || null;
    this.uuid = config?.uuid ?? '<unknown_uuid>';
    this.type = config?.type ?? 'unknown';
    this.has_data = config?.has_data ?? false;
    this.status = this.has_data ? 'Done' : 'Empty';
    this.created_on = config?.created_on;
    this.last_modified = config?.last_modified;
    this.general = config?.general;
  }
}
export interface GeneralSection {
  special?: RawSpecialValues;
  no_data?: RawSpecialValues;
}
export interface RawSpecialValues {
  [key: string]: number;
}
export interface EntityGroupSpecialValues<T = unknown> {
  [key: string]: T | undefined;
}
export interface DatasetSpecialValues {
  [key: string]: EntityGroupSpecialValues;
}
export interface Update {
  created_on: number;
  dataset_uuid: UUID;
  scenario_uuid: UUID;
  iteration: number;
  model_name: string;
  model_type: string;
  name: string;
  timestamp: number;
  type: string;
  uuid: UUID;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UpdateWithData<T = any> extends Update {
  data: DatasetData<T>;
}

export interface EntityUpdate<T> {
  timestamp: number;
  iteration: number;
  data: EntityGroupData<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DatasetWithData<T = any> extends Dataset {
  data?: DatasetData<T>;
  constructor(config: Partial<DatasetWithData<T>>) {
    super(config);
    this.data = config.data ?? {};
  }
}
export interface DatasetData<T> {
  [entityGroup: string]: EntityGroupData<T>;
}

interface BaseEntityGroup {
  id: number[];
}

interface EntityGroupProperties<T> {
  [componentProperty: string]: ComponentData<T> | T[];
}
export type EntityGroupData<T> = BaseEntityGroup & EntityGroupProperties<T>;

export interface ComponentData<T> {
  [property: string]: T[];
}

interface PointGeometryProperties extends EntityGroupData<number> {
  'geometry.x': number[];
  'geometry.y': number[];
}
export type PointGeometryData = BaseEntityGroup & PointGeometryProperties;

interface LineGeometryProperties extends EntityGroupProperties<LineCoordinate | Line3DCoordinate> {
  'geometry.linestring_2d': LineCoordinate[];
  'geometry.linestring_3d': Line3DCoordinate[];
}
export type LineGeometryData = BaseEntityGroup & LineGeometryProperties;

interface PolygonGeometryProperties extends EntityGroupProperties<PolygonCoordinate> {
  'geometry.polygon': PolygonCoordinate[];
}
export type PolygonGeometryData = BaseEntityGroup & PolygonGeometryProperties;
