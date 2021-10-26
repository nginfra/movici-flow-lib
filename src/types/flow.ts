export enum FlowSectionItem {
  PROJECT = 'project',
  DATASETS = 'datasets',
  SCENARIO = 'scenario',
  VISUALIZATION = 'visualization',
  EXPORT = 'export'
}
interface BaseFlowSection {
  name: FlowSectionItem;
  label: string;
  icon?: string;
  iconPack?: string;
  enabled: boolean;
  type: 'route' | 'callback';
}

interface RouteFlowSection extends BaseFlowSection {
  type: 'route';
  to: string;
}
interface CallbackFlowSection extends BaseFlowSection {
  type: 'callback';
  callback: () => void;
}

export type FlowSection = RouteFlowSection | CallbackFlowSection;

export interface FlowSectionCollection {
  [key: string]: FlowSection;
}

export interface FlowStoreConfig {
  currentProjectName?: string;
  currentScenarioName?: string;
  getScenario?: boolean;
  getProject?: boolean;
  disableCollapser?: boolean;
}
