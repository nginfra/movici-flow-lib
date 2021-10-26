import { Line3DCoordinate, LineCoordinate, PolygonCoordinate } from '@/flow/types/geometry';
import { UUID } from '@/flow/types/general';

export interface DatasetCollection {
  datasets: Dataset[];
}

export class Dataset {
  name: string;
  display_name: string;
  uuid: UUID;
  type: string;
  has_data: boolean;
  created_on?: number;
  last_modified?: number;
  status: string;
  constructor(config?: Partial<Dataset>) {
    this.name = config?.name ?? 'unknown_dataset';
    this.display_name = config?.display_name || this.name;
    this.uuid = config?.uuid ?? '<unknown_uuid>';
    this.type = config?.type ?? 'unknown';
    this.has_data = config?.has_data ?? false;
    this.status = this.has_data ? 'Done' : 'Empty';
    this.created_on = config?.created_on ?? undefined;
    this.last_modified = config?.last_modified ?? undefined;
  }
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
  point_properties: {
    position_x: number[];
    position_y: number[];
  };
}
export type PointGeometryData = BaseEntityGroup & PointGeometryProperties;

interface LineGeometryProperties extends EntityGroupProperties<LineCoordinate | Line3DCoordinate> {
  shape_properties: {
    linestring_2d: LineCoordinate[];
    linestring_3d: Line3DCoordinate[];
  };
}
export type LineGeometryData = BaseEntityGroup & LineGeometryProperties;

interface PolygonGeometryProperties extends EntityGroupProperties<PolygonCoordinate> {
  shape_properties: {
    polygon: PolygonCoordinate[];
  };
}
export type PolygonGeometryData = BaseEntityGroup & PolygonGeometryProperties;
