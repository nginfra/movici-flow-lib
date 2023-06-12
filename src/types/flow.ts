import type { UUID } from "./general";

export type FlowStep =
  | "project"
  | "workspace"
  | "dataset"
  | "scenario"
  | "visualization"
  | "export";

export type ExtendedFlowStep = FlowStep | "workspace" | "datasets";

export interface FlowSection {
  step: FlowStep;
  label: string;
  icon?: string;
  iconPack?: string;
  enabled: boolean;
  activate?: () => void;
}

export interface FlowLocation {
  step: ExtendedFlowStep;
  projectName?: string | null;
  scenarioName?: string | null;
  datasetUUID?: UUID | null;
  viewUUID?: UUID | null;
}

export interface FlowStoreConfig {
  currentProjectName?: string | null;
  currentScenarioName?: string | null;
  needScenario?: boolean;
  needProject?: boolean;
  disableCollapser?: boolean;
}
