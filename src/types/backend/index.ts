import DatasetService from './dataset';
import GeocodeService from './geocode';
import ProjectService from './project';
import ScenarioService from './scenario';
import SummaryService from './summary';
import UpdatesService from './updates';
import UserService from './user';
import ViewService from './view';

export interface Backend {
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

export {
  DatasetService,
  GeocodeService,
  ProjectService,
  ScenarioService,
  SummaryService,
  UpdatesService,
  UserService,
  ViewService
};
