import { VuexModule } from 'vuex-module-decorators';
import { Dataset, DatasetSummary, FlowStoreConfig, Project, Scenario, ShortScenario, TimeOrientedSimulationInfo, UUID, User, View } from '@/types';
import { ComposableVisualizerInfo } from '@/visualizers/VisualizerInfo';
import Backend from '@/api/backend';
import FlowUIStore from '@/store/FlowUserInterfaceStore';
declare class FlowStore extends VuexModule {
    visualizers: ComposableVisualizerInfo[];
    view: View | null;
    views: View[];
    project: Project | null;
    projects: Project[];
    scenarios: ShortScenario[];
    scenario: Scenario | null;
    timestamp: number;
    currentUser: User | null;
    datasetSummaries: Record<UUID, DatasetSummary>;
    scenarioSummaries: Record<UUID, Record<UUID, DatasetSummary>>;
    backend_: Backend | null;
    flowUIStore_: FlowUIStore | null;
    get hasProject(): boolean;
    get hasScenario(): boolean;
    get queryString(): string;
    get timelineInfo(): TimeOrientedSimulationInfo | null;
    get backend(): Backend | null;
    get capabilities(): string[] | undefined;
    get hasGeocodeCapabilities(): boolean;
    get hasUserCapabilities(): boolean;
    UPDATE_VISUALIZERS(visualizers: ComposableVisualizerInfo[]): void;
    SET_PROJECTS(projects: Project[]): void;
    SET_CURRENT_PROJECT(project: Project | null): void;
    SET_CURRENT_SCENARIO(scenario: Scenario | null): void;
    SET_SCENARIOS(scenarios: ShortScenario[]): void;
    UPDATE_VIEW(view: View | null): void;
    SET_VIEWS(views: View[]): void;
    SET_TIMESTAMP(timestamp: number): void;
    SET_USER(user: User): void;
    SET_BACKEND(backend: Backend): void;
    SET_UI_STORE(store: FlowUIStore): void;
    ADD_DATASET_SUMMARY(payload: {
        datasetUUID: UUID;
        scenarioUUID?: UUID | null;
        summary: DatasetSummary;
    }): void;
    CLEAR_SUMMARIES(): void;
    updateCurrentView(view: View | null): void;
    updateVisualizers(visualizers: ComposableVisualizerInfo[]): void;
    getProjects(): Promise<void>;
    setCurrentFlowProject(project: Project): Promise<void>;
    setApiClient(backend: Backend): void;
    setUIStore(flowUIStore_: FlowUIStore): void;
    setCurrentFlowScenario(scenario: Scenario): Promise<void>;
    getDatasets(projectUUID: UUID): Promise<Dataset[] | null>;
    getScenariosByProject(projectUUID?: UUID): Promise<ShortScenario[]>;
    getViewsByScenario(scenarioUUID?: string): Promise<View[]>;
    getScenario(activeScenarioUUID: UUID): Promise<Scenario | null | undefined>;
    setTimestamp(value: number): void;
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
    getDatasetSummary(params: {
        datasetUUID: string;
        scenarioUUID?: string | null;
    }): Promise<DatasetSummary | null>;
    clearSummaries(): void;
    exportFromConfig(payload: {
        datasetName: string;
        entityGroup: string;
        timestamp?: number;
    }): Promise<void>;
    resetFlowStore(): Promise<void>;
    createView({ scenarioUUID, view }: {
        scenarioUUID: UUID;
        view: View;
    }): Promise<{
        view_uuid: string;
    } | null | undefined>;
    getViews(scenarioUUID: UUID): Promise<View[] | null | undefined>;
    getView(viewUUID: UUID): Promise<View | null | undefined>;
    updateView({ viewUUID, view }: {
        viewUUID: UUID;
        view: View;
    }): Promise<void | null | undefined>;
    deleteView(viewUUID: UUID): Promise<void | null | undefined>;
    /**
     * This function sets up the start of the flow, depending on the configuration.
     * The user can start the flow on different sections, each has a different config that is validated here.
     * If config is valid, we query the resources and set them up in the store so they're accessible in the component
     *
     * @param config
     */
    setupFlowStore({ config, reset }: {
        config: FlowStoreConfig;
        reset?: boolean;
    }): Promise<void>;
}
export default FlowStore;
