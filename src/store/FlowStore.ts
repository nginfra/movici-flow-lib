import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import {
  Dataset,
  DatasetSummary,
  FlowStoreConfig,
  Project,
  Scenario,
  ShortScenario,
  SimulationMode,
  TimeOrientedSimulationInfo,
  UUID,
  View
} from '@/flow/types';
import { User } from '@/flow/types/users';
import { ComposableVisualizerInfo } from '@/flow/visualizers/VisualizerInfo';
import { exportFromConfig } from '@/flow/utils/DataExporter';
import Backend from '@/flow/api/backend';
import FlowUIStore from '@/flow/store/FlowUserInterfaceStore';

@Module({
  name: 'flow',
  namespaced: true
})
class FlowStore extends VuexModule {
  visualizers: ComposableVisualizerInfo[] = [];
  view: View | null = null;
  views: View[] = [];
  project: Project | null = null;
  projects: Project[] = [];
  scenarios: ShortScenario[] = [];
  scenario: Scenario | null = null;
  timestamp = 0;
  currentUser: User | null = null;
  datasetSummaries: Record<UUID, DatasetSummary> = {};
  scenarioSummaries: Record<UUID, Record<UUID, DatasetSummary>> = {};
  // injected resources
  backend_: Backend | null = null;
  flowUIStore_: FlowUIStore | null = null;

  get hasProject(): boolean {
    return !!this.project;
  }

  get hasScenario(): boolean {
    return !!this.scenario;
  }

  // TODO: try to use router link options to do this
  get queryString() {
    const params: Record<string, string | undefined> = {
      project: this.project?.name,
      scenario: this.scenario?.name
    };

    return Object.keys(params)
      .filter((key: string) => params[key])
      .map((key: string) => key + '=' + params[key])
      .join('&');
  }

  get timelineInfo(): TimeOrientedSimulationInfo | null {
    if (this.scenario?.simulation_info.mode === SimulationMode.TIME_ORIENTED) {
      return this.scenario.simulation_info;
    }
    return null;
  }

  get backend() {
    return this.backend_;
  }

  get capabilities() {
    return this.backend?.getCapabilities();
  }

  get hasGeocodeCapabilities() {
    return this.capabilities?.indexOf('geocode') != -1;
  }

  get hasUserCapabilities() {
    return this.capabilities?.indexOf('user') != -1;
  }

  @Mutation
  UPDATE_VISUALIZERS(visualizers: ComposableVisualizerInfo[]) {
    this.visualizers = visualizers;
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
  UPDATE_VIEW(view: View | null) {
    this.view = view;
  }

  @Mutation
  SET_VIEWS(views: View[]) {
    this.views = views;
  }

  @Mutation
  SET_TIMESTAMP(timestamp: number) {
    this.timestamp = timestamp;
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
  updateCurrentView(view: View | null) {
    this.UPDATE_VIEW(view);
  }

  @Action({ rawError: true })
  updateVisualizers(visualizers: ComposableVisualizerInfo[]) {
    this.UPDATE_VISUALIZERS(visualizers);
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
  async setCurrentFlowScenario(scenario: Scenario) {
    this.SET_CURRENT_SCENARIO(scenario);

    this.flowUIStore_?.enableSection({ visualization: !!scenario, export: !!scenario });

    await this.getViewsByScenario(scenario.uuid);
  }

  @Action({ rawError: true })
  async getDatasets(projectUUID: UUID): Promise<Dataset[] | null> {
    const activeProjectUUID = this.project?.uuid || projectUUID,
      datasets = activeProjectUUID
        ? (await this.backend?.dataset.list(activeProjectUUID)) ?? []
        : [];

    return datasets;
  }

  @Action({ rawError: true })
  async getScenariosByProject(projectUUID?: UUID) {
    const activeProjectUUID = projectUUID ?? this.project?.uuid,
      scenarios: ShortScenario[] = activeProjectUUID
        ? (await this.backend?.scenario.list(activeProjectUUID)) ?? []
        : [];

    this.SET_SCENARIOS(scenarios);
    return scenarios;
  }

  @Action({ rawError: true })
  async getViewsByScenario(scenarioUUID?: string): Promise<View[]> {
    const currentScenarioUUID = scenarioUUID ?? this.scenario?.uuid;
    if (currentScenarioUUID) {
      const views = (await this.backend?.view.list(currentScenarioUUID)) ?? [];
      this.SET_VIEWS(views);
      return views;
    }

    return [];
  }

  @Action({ rawError: true })
  async getScenario(activeScenarioUUID: UUID) {
    if (activeScenarioUUID) {
      return await this.backend?.scenario.get(activeScenarioUUID);
    }
    return null;
  }

  @Action({ rawError: true })
  setTimestamp(value: number) {
    this.SET_TIMESTAMP(value);
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

    const datasets = (await this.getDatasets(this.project?.uuid ?? '<unknown project>'))?.reduce<
      Record<string, Dataset>
    >((obj, curr) => {
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
          timestamp: payload.timestamp ?? this.timestamp
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
    this.SET_TIMESTAMP(0);
    this.UPDATE_VISUALIZERS([]);
  }

  @Action({ rawError: true })
  async createView({ scenarioUUID, view }: { scenarioUUID: UUID; view: View }) {
    return await this.backend?.view.create(scenarioUUID, view);
  }

  @Action({ rawError: true })
  async getViews(scenarioUUID: UUID) {
    return await this.backend?.view.list(scenarioUUID);
  }

  @Action({ rawError: true })
  async getView(viewUUID: UUID) {
    return await this.backend?.view.get(viewUUID);
  }

  @Action({ rawError: true })
  async updateView({ viewUUID, view }: { viewUUID: UUID; view: View }) {
    return await this.backend?.view.update(viewUUID, view);
  }

  @Action({ rawError: true })
  async deleteView(viewUUID: UUID) {
    return await this.backend?.view.delete(viewUUID);
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

    if (!this.currentUser) {
      const user = await this.backend?.user.get();

      if (user) {
        this.SET_USER(user);
      }
    }

    if (!this.projects || !this.projects.length) {
      await this.getProjects();
    }

    const {
      currentProjectName,
      currentScenarioName,
      getProject = false,
      getScenario = false,
      disableCollapser = false
    } = config;

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

        throw new Error('Invalid project');
      }
    }

    // has a project (either previously set on the store, or by last if and needs the scenario)
    // needs a scenario and provided a scenario name
    if (this.project && getScenario) {
      const scenarios = (await this.getScenariosByProject(this.project.uuid)) || [];

      if (currentScenarioName) {
        const shortScenario = scenarios.find(p => p.name === currentScenarioName);

        if (shortScenario) {
          const scenario = await this.getScenario(shortScenario.uuid);

          // full scenario not found
          if (scenario) {
            await this.setCurrentFlowScenario(scenario);
          } else {
            this.resetFlowStore();

            throw new Error('Invalid full scenario');
          }
        } else {
          // scenario name is invalid
          this.resetFlowStore();

          throw new Error('Invalid short Scenario');
        }
      }
    }

    this.flowUIStore_?.enableSection({
      datasets: this.hasProject,
      scenario: this.hasProject,
      visualization: this.hasScenario,
      export: this.hasScenario
    });

    this.flowUIStore_?.setDisableCollapser(disableCollapser);
  }
}

export default FlowStore;
