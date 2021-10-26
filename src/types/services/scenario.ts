import { Scenario, ShortScenario, UUID } from '@/flow/types';

export default interface ScenarioService {
  get(scenario_uuid: UUID): Promise<Scenario | null>;
  list(project_uuid: UUID): Promise<ShortScenario[] | null>;
}
