import {
  User,
  Dataset,
  DatasetWithData,
  Project,
  Scenario,
  ShortScenario,
  DatasetSummary,
  ComponentProperty,
  Update,
  UpdateWithData,
  UUID,
  View,
  ViewCrudResponse,
  GeocodeSearchQuery,
  GeocodeSearchResult,
  GeocodeSuggestion
} from '@movici-flow-common/types';

export interface ViewService {
  create(scenarioUUID: UUID, view: View): Promise<ViewCrudResponse | null>;
  list(scenarioUUID: UUID): Promise<View[] | null>;
  get(viewUUID: UUID): Promise<View | null>;
  update(viewUUID: UUID, view: View): Promise<ViewCrudResponse | null>;
  delete(viewUUID: UUID): Promise<ViewCrudResponse | null>;
}

export interface UpdatesService {
  get(
    uuid: UUID,
    entityGroup: string,
    properties: ComponentProperty[]
  ): Promise<UpdateWithData | null>;

  list(uuid: string): Promise<Update[] | null>;
}

export interface SummaryService {
  getScenario(scenario_uuid: UUID, dataset_uuid: UUID): Promise<DatasetSummary | null>;
  getDataset(dataset_uuid: UUID): Promise<DatasetSummary | null>;
}

export interface ScenarioService {
  get(scenario_uuid: UUID): Promise<Scenario | null>;
  list(project_uuid?: UUID): Promise<ShortScenario[] | null>;
}

export interface ProjectService {
  list(): Promise<Project[] | null>;
}

export interface GeocodeService {
  resolveSuggestion(suggestion: GeocodeSuggestion): Promise<GeocodeSearchResult | null>;
  getSuggestions(query: GeocodeSearchQuery): Promise<GeocodeSuggestion[] | null>;
  getResults(query: GeocodeSearchQuery): Promise<GeocodeSearchResult[] | null>;
}

export interface DatasetService {
  list(project_uuid?: UUID): Promise<Dataset[]>;

  getData<T>(params: {
    datasetUUID: UUID;
    entityGroup?: string;
    properties?: ComponentProperty[];
  }): Promise<DatasetWithData<T> | null>;

  getState<T>(params: {
    datasetUUID: UUID;
    scenarioUUID: UUID;
    entityGroup: string;
    properties?: ComponentProperty[];
    timestamp?: number;
  }): Promise<DatasetWithData<T> | null>;

  getMetaData?: (datasetUUID: UUID) => Promise<Dataset | null>;
}

export interface UserService {
  get(): Promise<User | null>;
}

export interface FetchRequestOptions {
  datasetDataBlob: { datasetUUID: string };
  scenario: { scenarioUUID: string };
}
export interface FetchRequestService {
  getRequest<T extends keyof FetchRequestOptions>(
    request: T,
    options: FetchRequestOptions[T]
  ): { url: string; options: RequestInit };
}

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
  fetch: FetchRequestService;
}
