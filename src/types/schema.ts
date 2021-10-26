import { UUID } from '@/flow/types/general';
import { Dataset } from './datasets';
import { FlowVisualizerType } from './flowVisualizers';
import { EntityGeometry } from './geometry';
import { Scenario, ScenarioDataset, ShortScenario } from './scenarios';

export interface DatasetSummary {
  count: number;
  entity_groups: EntityGroupSummary[];
}

export enum DatasetFormat {
  ENTITY_BASED = 'entity_based',
  UNSTRUCTURED = 'unstructured',
  BINARY = 'binary'
}

export interface DatasetSchema {
  dataset_types: DatasetType[];
  entity_types: EntityType[];
  property_types: PropertyType[];
}

export interface DatasetType {
  uuid?: UUID;
  name: string;
  format: DatasetFormat;
}

export interface EntityType {
  uuid?: UUID;
  name: string;
}

export interface EntityGroupSummary {
  name: string;
  count: number;
  properties: PropertySummary[];
  geometry?: EntityGeometry | null;
  type?: FlowVisualizerType | null;
}
export interface ComponentProperty {
  component: string | null;
  name: string;
}
export interface PropertyType extends ComponentProperty {
  uuid?: UUID;
  data_type: string;
  description?: string;
  unit?: string;
  enum_name?: string | null;
}

export interface ExportConfig {
  dataset: Dataset | ScenarioDataset | null;
  projectName: string;
  entityName: string;
  scenario?: ShortScenario | Scenario;
  timestamp?: number;
}
export interface PropertySummary extends PropertyType {
  min_val: number | null;
  max_val: number | null;
}
