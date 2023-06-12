import type { ShortDataset } from "./datasets";
import type { UUID } from "./general";
import type { Scenario, ShortScenario } from "./scenarios";

export enum ImportantAttribute {
  DIPLAY_NAME = "display_name",
  NAME = "name",
  REFERENCE = "reference",
}

export const IMPORTANT_ATTRIBUTES = Object.values(ImportantAttribute);

export interface DatasetSummary {
  count: number;
  entity_groups: EntityGroupSummary[];
  bounding_box?: [number, number, number, number];
  epsg_code?: number;
  general?: {
    enum?: Record<string, string[]>;
  };
}

export enum DatasetFormat {
  ENTITY_BASED = "entity_based",
  UNSTRUCTURED = "unstructured",
  BINARY = "binary",
}

export interface DatasetSchema {
  dataset_types: DatasetType[];
  entity_types: EntityType[];
  property_types: AttributeType[];
}

export interface DatasetType {
  uuid: UUID;
  name: string;
  format: DatasetFormat;
}

export interface EntityType {
  uuid: UUID;
  name: string;
}

export interface EntityGroupSummary {
  name: string;
  count: number;
  properties: AttributeSummary[];
}
export interface DataAttribute {
  name: string;
}
export interface AttributeType extends DataAttribute {
  uuid: UUID;
  data_type: string;
  description?: string;
  unit?: string;
  enum_name?: string | null;
}

export interface ExportConfig {
  dataset: ShortDataset | null;
  projectName: string;
  entityName: string;
  scenario?: ShortScenario | Scenario;
  timestamp?: number;
}
export interface AttributeSummary extends AttributeType {
  min_val: number | null;
  max_val: number | null;
}

export type SimpleAttributeSummary = Omit<AttributeSummary, "uuid">;
