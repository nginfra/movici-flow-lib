import {
  Coordinate,
  GridCellPoints,
  Line3DCoordinate,
  LineCoordinate,
  PolygonCoordinate,
  TopologyLayerData
} from './geometry';
import { ArrayValues, UUID } from './general';
import { ImportantAttribute } from './schema';

export interface DatasetCollection {
  datasets: Dataset[];
}

export interface ShortDataset {
  name: string;
  uuid: UUID;
  type: string;
}
export class Dataset implements ShortDataset {
  name: string;
  display_name?: string | null;
  uuid: UUID;
  type: string;
  has_data: boolean;
  status: string;
  epsg_code?: number;
  created_on?: number | null;
  last_modified?: number;
  general?: GeneralSection;
  constructor(config?: Partial<Dataset>) {
    this.name = config?.name ?? 'unknown_dataset';
    this.display_name = config?.display_name || null;
    this.uuid = config?.uuid ?? '<unknown_uuid>';
    this.type = config?.type ?? 'unknown';
    this.has_data = config?.has_data ?? false;
    this.status = this.has_data ? 'Done' : 'Empty';
    this.epsg_code = config?.epsg_code;
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

export interface BaseEntityGroup {
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

interface GridCellProperties extends EntityGroupProperties<GridCellPoints> {
  'grid.grid_points': GridCellPoints[];
}
export type GridCellGeometryData = BaseEntityGroup & GridCellProperties;

export type ImportantAttributeData = Record<ImportantAttribute, string>;

export type EntityGroupImportantAttributesData = Partial<ArrayValues<ImportantAttributeData>>;

export type DeckEntityObject<Coord extends Coordinate | unknown> = TopologyLayerData<
  Coord | unknown
> &
  Partial<ImportantAttributeData>;
