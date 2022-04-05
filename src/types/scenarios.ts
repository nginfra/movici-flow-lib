import { UUID } from './general';

export type AnalysisTemplate = Record<string, unknown>;
export interface ShortScenario {
  uuid: UUID;
  name: string;
  display_name: string;
  status?: string;
  has_simulation?: boolean;
  version: number;
  created_on: number;
  has_timeline?: boolean;
}

export interface Scenario extends ShortScenario {
  project_name: string;
  datasets: ScenarioDataset[];
  simulation_info: SimulationInfo;
  has_timeline?: boolean;
  models?: ScenarioModel[];
  bounding_box?: [number, number, number, number];
}

export interface ScenarioModel {
  type: string;
  name: string;
  [key: string]: unknown;
}
export enum SimulationMode {
  TIME_ORIENTED = 'time_oriented',
  EVENT_ORIENTED = 'event_oriented'
}

export interface TimeOrientedSimulationInfo {
  mode: SimulationMode.TIME_ORIENTED;
  start_time: number;
  reference_time: number;
  duration: number;
  time_scale: number;
}

export interface EventOrientedSimulationInfo {
  mode: SimulationMode.EVENT_ORIENTED;
  events_dataset: string;
  events: { timestamp: number; diplay_name: string }[];
}
export type SimulationInfo = TimeOrientedSimulationInfo | EventOrientedSimulationInfo;

export interface ScenarioDataset {
  name: string;
  uuid: UUID;
  type: string;
  display_name?: string;
}
export interface Simulation {
  scenario_uuid: UUID;
  scenario_name: string;
  status: string;
  live_mode: string;
  current_time: number;
}

export interface SimulationControlMessage {
  speed?: number;
  interval?: number;
  forward_to?: number;
  forward_by?: number;
}

export interface TimelineInfo {
  scenario_uuid: string;
  timestamps: number[];
  update_count: number;
}
