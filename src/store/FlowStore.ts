import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import {
  Backend,
  Dataset,
  DatasetSummary,
  FlowStoreConfig,
  Project,
  Scenario,
  ShortScenario,
  SimulationMode,
  TimeOrientedSimulationInfo,
  UUID
} from '../types';
import { User } from '../types/users';
import { exportFromConfig } from '../utils/DataExporter';
import FlowUIStore from '../store/FlowUserInterfaceStore';

@Module({
  name: 'flow',
  namespaced: true
})
export default class FlowStore extends VuexModule {
  project: Project | null = null;
  projects: Project[] = [];
  scenarios: ShortScenario[] = [];
  scenario: Scenario | null = null;
  scenarioSummaries: Record<UUID, Record<UUID, DatasetSummary>> = {};
  datasetSummaries: Record<UUID, DatasetSummary> = {};
  currentUser: User | null = null;
  // injected resources
  backend_: Backend | null = null;
  flowUIStore_: FlowUIStore | null = null;

  get backend() {
    return this.backend_;
  }

  get capabilities() {
    return this.backend?.getCapabilities();
  }

  get hasGeocodeCapabilities() {
    return this.capabilities?.indexOf('geocode') !== -1;
  }

  get hasUserCapabilities() {
    return this.capabilities?.indexOf('user') !== -1;
  }

  get hasProjectsCapabilities() {
    return this.capabilities?.indexOf('projects') !== -1;
  }

  get hasProject(): boolean {
    return !!this.project;
  }

  get hasScenario(): boolean {
    return !!this.scenario;
  }
  get requiresProject(): boolean {
    return this.hasProjectsCapabilities && !this.project;
  }

  get timelineInfo(): TimeOrientedSimulationInfo | null {
    if (this.scenario?.simulation_info.mode === SimulationMode.TIME_ORIENTED) {
      return this.scenario.simulation_info;
    }
    return null;
  }

  @Mutation
  SET_PROJECTS(projects: Project[]) {
    this.projects = projects;
  }

  @Mutation
  SET_CURRENT_PROJECT(project: Project | null) {
    this.project = project;
  }

  @Mutation
  SET_CURRENT_SCENARIO(scenario: Scenario | null) {
    this.scenario = scenario;
  }

  @Mutation
  SET_SCENARIOS(scenarios: ShortScenario[]) {
    this.scenarios = scenarios;
  }

  @Mutation
  SET_USER(user: User) {
    this.currentUser = user;
  }

  @Mutation
  SET_BACKEND(backend: Backend) {
    this.backend_ = backend;
  }

  @Mutation
  SET_UI_STORE(store: FlowUIStore) {
    this.flowUIStore_ = store;
  }

  @Mutation
  ADD_DATASET_SUMMARY(payload: {
    datasetUUID: UUID;
    scenarioUUID?: UUID | null;
    summary: DatasetSummary;
  }) {
    if (payload.scenarioUUID) {
      this.scenarioSummaries[payload.scenarioUUID] ??= {};
      this.scenarioSummaries[payload.scenarioUUID][payload.datasetUUID] = payload.summary;
    } else {
      this.datasetSummaries[payload.datasetUUID] = payload.summary;
    }
  }

  @Mutation
  CLEAR_SUMMARIES() {
    this.datasetSummaries = {};
    this.scenarioSummaries = {};
  }

  @Action({ rawError: true })
  async getProjects() {
    this.SET_PROJECTS((await this.backend?.project.list()) ?? []);
  }

  @Action({ rawError: true })
  async setCurrentFlowProject(project: Project) {
    this.flowUIStore_?.enableSection({
      datasets: true,
      scenario: true
    });

    this.SET_CURRENT_PROJECT(project);
  }

  @Action({ rawError: true })
  setApiClient(backend: Backend) {
    this.SET_BACKEND(backend);
  }

  @Action({ rawError: true })
  setUIStore(flowUIStore_: FlowUIStore) {
    this.SET_UI_STORE(flowUIStore_);
  }

  @Action({ rawError: true })
  async getDatasets(): Promise<Dataset[] | null> {
    return (await this.backend?.dataset.list(this.project?.uuid)) ?? null;
  }

  @Action({ rawError: true })
  async setCurrentFlowScenario(scenario: Scenario) {
    this.SET_CURRENT_SCENARIO(scenario);
    this.flowUIStore_?.enableSection({ visualization: !!scenario, export: !!scenario });
  }

  @Action({ rawError: true })
  async getScenario(activeScenarioUUID: UUID) {
    if (activeScenarioUUID) {
      return await this.backend?.scenario.get(activeScenarioUUID);
    }
    return null;
  }

  @Action({ rawError: true })
  async getScenarios() {
    const scenarios = (await this.backend?.scenario.list(this.project?.uuid)) ?? [];
    this.SET_SCENARIOS(scenarios);
    return scenarios;
  }

  /**
   * Get a Dataset Summary by `params.datasetUUUID`. When omitting `params.scenarioUUID` the summary
   * will be either  for the init data or, if the `FlowStore` has a `currentScenarioUUID` defined,
   * for dataset in that scenario. Supplying a `params.scenarioUUID` will request the summary for
   * that scenario. If a `null` value is supplied for `params.scenarioUUID`, the summary is
   * requested for the init data, regardless of whether the `SummaryStore` is configured with a
   * `currentScenarioUUID`
   * @param params
   *   datasetUUID: the dataset UUID of the requested summary
   *   scenarioUUID: Optional scenario UUID to specify what (if any) scenario to request the
   *     dataset summary for. Omit this parameter to automatically determine the scenario (if any)
   */
  @Action({ rawError: true })
  async getDatasetSummary(params: {
    datasetUUID: string;
    scenarioUUID?: string | null;
  }): Promise<DatasetSummary | null> {
    const { datasetUUID } = params;
    let { scenarioUUID } = params;

    scenarioUUID ??= this.scenario?.uuid;

    let summary: DatasetSummary | null;
    summary = scenarioUUID
      ? this.scenarioSummaries[scenarioUUID]?.[datasetUUID]
      : this.datasetSummaries[datasetUUID];

    if (!summary) {
      summary =
        (scenarioUUID
          ? await this.backend?.summary.getScenario(scenarioUUID, datasetUUID)
          : await this.backend?.summary.getDataset(datasetUUID)) ?? null;

      if (summary) {
        this.ADD_DATASET_SUMMARY({
          datasetUUID,
          scenarioUUID,
          summary
        });
      }
    }

    return summary;
  }

  @Action({ rawError: true })
  clearSummaries() {
    this.CLEAR_SUMMARIES();
  }

  @Action({ rawError: true })
  async exportFromConfig(payload: {
    datasetName: string;
    entityGroup: string;
    timestamp?: number;
  }) {
    this.flowUIStore_?.setLoading({ value: true, msg: 'Exporting data...' });

    const datasets = (await this.getDatasets())?.reduce<Record<string, Dataset>>((obj, curr) => {
      obj[curr.name] = curr;
      return obj;
    }, {});

    if (datasets && this.project && this.scenario && this.timelineInfo && this.backend) {
      await exportFromConfig({
        config: {
          dataset: datasets[payload.datasetName] ?? null,
          projectName: this.project?.display_name,
          scenario: this.scenario,
          entityName: payload.entityGroup,
          timestamp: payload.timestamp
        },
        timelineInfo: this.timelineInfo,
        backend: this.backend
      });
    }

    this.flowUIStore_?.setLoading({ value: false });
  }

  @Action({ rawError: true })
  async resetFlowStore() {
    this.SET_PROJECTS([]);
    this.SET_CURRENT_PROJECT(null);
    this.SET_SCENARIOS([]);
    this.SET_CURRENT_SCENARIO(null);
  }

  /**
   * This function sets up the start of the flow, depending on the configuration.
   * The user can start the flow on different sections, each has a different config that is validated here.
   * If config is valid, we query the resources and set them up in the store so they're accessible in the component
   *
   * @param config
   */
  @Action({ rawError: true })
  async setupFlowStore({ config, reset = true }: { config: FlowStoreConfig; reset?: boolean }) {
    if (reset) {
      this.resetFlowStore();
      this.clearSummaries();
    }

    await this.setupUser();
    await this.setupProjects(config);
    await this.setupScenarios(config);
    this.flowUIStore_?.enableSection({
      datasets: !this.requiresProject,
      scenario: !this.requiresProject,
      visualization: this.hasScenario,
      export: this.hasScenario
    });

    this.flowUIStore_?.setDisableCollapser(!!config.disableCollapser);
  }

  @Action({ rawError: true })
  async setupUser() {
    // still needs a condition for when there's no user (local flow)
    if (this.hasUserCapabilities) {
      if (!this.currentUser) {
        const user = await this.backend?.user.get();

        if (user) {
          this.SET_USER(user);
        } else {
          throw new Error('No user found');
        }
      }
    }
  }

  @Action({ rawError: true })
  async setupProjects(config: FlowStoreConfig) {
    if (this.hasProjectsCapabilities) {
      const { currentProjectName, getProject = false } = config;

      if (!this.projects || !this.projects.length) {
        await this.getProjects();
      }

      // needs a project but doesn't provide project name
      if (getProject && !currentProjectName) {
        throw new Error('Project name not provided');
      }

      // project is not set and provides a project name
      if (!this.project && currentProjectName) {
        const currentProject = this.projects.find((p: Project) => p.name === currentProjectName);

        if (currentProject?.uuid) {
          await this.setCurrentFlowProject(currentProject);
        } else {
          // project name is invalid
          this.resetFlowStore();
          throw new Error('Invalid Project');
        }
      }
    } else {
      this.flowUIStore_?.enableSection({
        datasets: true,
        scenario: true
      });
    }
  }

  @Action({ rawError: true })
  async setupScenarios(config: FlowStoreConfig) {
    // has a project (either previously set on the store, or by last if and needs the scenario)
    // needs a scenario and provided a scenario name
    const { currentScenarioName, getScenario = false } = config;
    if (!getScenario || (this.hasProjectsCapabilities && !this.project)) {
      return;
    }
    const scenarios = (await this.getScenarios()) || [];

    if (currentScenarioName) {
      const shortScenario = scenarios.find(p => p.name === currentScenarioName);

      if (shortScenario) {
        const scenario = await this.getScenario(shortScenario.uuid);

        // full scenario not found
        if (scenario) {
          await this.setCurrentFlowScenario(scenario);
        } else {
          this.resetFlowStore();
          throw new Error('Invalid Scenario');
        }
      } else {
        // scenario name is invalid
        this.resetFlowStore();
        throw new Error('Invalid short Scenario');
      }
    }
  }
}
