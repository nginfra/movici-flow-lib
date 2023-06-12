import type {
  Coordinate,
  GridCellPoints,
  Line3DCoordinate,
  LineCoordinate,
  PolygonCoordinate,
  TopologyLayerData,
} from "./geometry";
import type { ArrayValues, UUID } from "./general";
import type { ImportantAttribute } from "./schema";

export interface DatasetCollection {
  datasets: Dataset[];
}

export interface ShortDataset {
  name: string;
  uuid: UUID;
  type: string;
  has_data: boolean;
  display_name: string | null;
  created_on: number | null;
  last_modified: number;
}
export interface Dataset extends ShortDataset {
  name: string;
  display_name: string | null;
  uuid: UUID;
  type: string;
  has_data: boolean;
  epsg_code?: number;
  created_on: number;
  last_modified: number;
  general?: GeneralSection;
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
export interface DatasetWithData<T = any> extends Dataset {
  data?: DatasetData<T>;
}
export interface DatasetData<T> {
  [entityGroup: string]: EntityGroupData<T>;
}

export interface BaseEntityGroup {
  id: number[];
}

interface EntityGroupAttributes<T> {
  [attribute: string]: T[];
}
export type EntityGroupData<T> = BaseEntityGroup & EntityGroupAttributes<T>;

interface PointGeometryAttributes extends EntityGroupData<number> {
  "geometry.x": number[];
  "geometry.y": number[];
}
export type PointGeometryData = BaseEntityGroup & PointGeometryAttributes;

interface LineGeometryAttributes extends EntityGroupAttributes<LineCoordinate | Line3DCoordinate> {
  "geometry.linestring_2d": LineCoordinate[];
  "geometry.linestring_3d": Line3DCoordinate[];
}
export type LineGeometryData = BaseEntityGroup & LineGeometryAttributes;

interface PolygonGeometryAttributes extends EntityGroupAttributes<PolygonCoordinate> {
  "geometry.polygon_3d": PolygonCoordinate[];
  "geometry.polygon_2d": PolygonCoordinate[];
  "geometry.polygon": PolygonCoordinate[];
}
export type PolygonGeometryData = BaseEntityGroup & PolygonGeometryAttributes;

interface GridCellAttributes extends EntityGroupAttributes<GridCellPoints> {
  "grid.grid_points": GridCellPoints[];
}
export type GridCellGeometryData = BaseEntityGroup & GridCellAttributes;

export type ImportantAttributeData = Record<ImportantAttribute, string>;

export type EntityGroupImportantAttributesData = Partial<ArrayValues<ImportantAttributeData>>;

export type DeckEntityObject<Coord extends Coordinate | unknown> = TopologyLayerData<
  Coord | unknown
> &
  Partial<ImportantAttributeData>;
