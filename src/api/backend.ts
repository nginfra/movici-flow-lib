import DatasetService from '../types/services/dataset';
import GeocodeService from '../types/services/geocode';
import ProjectService from '../types/services/project';
import ScenarioService from '../types/services/scenario';
import SummaryService from '../types/services/summary';
import UpdatesService from '../types/services/updates';
import UserService from '../types/services/user';
import ViewService from '../types/services/view';

export default interface Backend {
  getCapabilities(): string[];
  dataset: DatasetService;
  geocode: GeocodeService;
  project: ProjectService;
  scenario: ScenarioService;
  summary: SummaryService;
  updates: UpdatesService;
  user: UserService;
  view: ViewService;
}
