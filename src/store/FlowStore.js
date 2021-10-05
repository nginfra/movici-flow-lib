import { __decorate } from "tslib";
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import { SimulationMode } from '@/types';
import { exportFromConfig } from '@/utils/DataExporter';
let FlowStore = class FlowStore extends VuexModule {
    constructor() {
        super(...arguments);
        this.visualizers = [];
        this.view = null;
        this.views = [];
        this.project = null;
        this.projects = [];
        this.scenarios = [];
        this.scenario = null;
        this.timestamp = 0;
        this.currentUser = null;
        this.datasetSummaries = {};
        this.scenarioSummaries = {};
        // injected resources
        this.backend_ = null;
        this.flowUIStore_ = null;
    }
    get hasProject() {
        return !!this.project;
    }
    get hasScenario() {
        return !!this.scenario;
    }
    // TODO: try to use router link options to do this
    get queryString() {
        var _a, _b;
        const params = {
            project: (_a = this.project) === null || _a === void 0 ? void 0 : _a.name,
            scenario: (_b = this.scenario) === null || _b === void 0 ? void 0 : _b.name
        };
        return Object.keys(params)
            .filter((key) => params[key])
            .map((key) => key + '=' + params[key])
            .join('&');
    }
    get timelineInfo() {
        var _a;
        if (((_a = this.scenario) === null || _a === void 0 ? void 0 : _a.simulation_info.mode) === SimulationMode.TIME_ORIENTED) {
            return this.scenario.simulation_info;
        }
        return null;
    }
    get backend() {
        return this.backend_;
    }
    get capabilities() {
        var _a;
        return (_a = this.backend) === null || _a === void 0 ? void 0 : _a.getCapabilities();
    }
    get hasGeocodeCapabilities() {
        var _a;
        return ((_a = this.capabilities) === null || _a === void 0 ? void 0 : _a.indexOf('geocode')) != -1;
    }
    get hasUserCapabilities() {
        var _a;
        return ((_a = this.capabilities) === null || _a === void 0 ? void 0 : _a.indexOf('user')) != -1;
    }
    UPDATE_VISUALIZERS(visualizers) {
        this.visualizers = visualizers;
    }
    SET_PROJECTS(projects) {
        this.projects = projects;
    }
    SET_CURRENT_PROJECT(project) {
        this.project = project;
    }
    SET_CURRENT_SCENARIO(scenario) {
        this.scenario = scenario;
    }
    SET_SCENARIOS(scenarios) {
        this.scenarios = scenarios;
    }
    UPDATE_VIEW(view) {
        this.view = view;
    }
    SET_VIEWS(views) {
        this.views = views;
    }
    SET_TIMESTAMP(timestamp) {
        this.timestamp = timestamp;
    }
    SET_USER(user) {
        this.currentUser = user;
    }
    SET_BACKEND(backend) {
        this.backend_ = backend;
    }
    SET_UI_STORE(store) {
        this.flowUIStore_ = store;
    }
    ADD_DATASET_SUMMARY(payload) {
        var _a;
        var _b, _c;
        if (payload.scenarioUUID) {
            (_a = (_b = this.scenarioSummaries)[_c = payload.scenarioUUID]) !== null && _a !== void 0 ? _a : (_b[_c] = {});
            this.scenarioSummaries[payload.scenarioUUID][payload.datasetUUID] = payload.summary;
        }
        else {
            this.datasetSummaries[payload.datasetUUID] = payload.summary;
        }
    }
    CLEAR_SUMMARIES() {
        this.datasetSummaries = {};
        this.scenarioSummaries = {};
    }
    updateCurrentView(view) {
        this.UPDATE_VIEW(view);
    }
    updateVisualizers(visualizers) {
        this.UPDATE_VISUALIZERS(visualizers);
    }
    async getProjects() {
        var _a, _b;
        this.SET_PROJECTS((_b = (await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.project.list()))) !== null && _b !== void 0 ? _b : []);
    }
    async setCurrentFlowProject(project) {
        var _a;
        (_a = this.flowUIStore_) === null || _a === void 0 ? void 0 : _a.enableSection({
            datasets: true,
            scenario: true
        });
        this.SET_CURRENT_PROJECT(project);
    }
    setApiClient(backend) {
        this.SET_BACKEND(backend);
    }
    setUIStore(flowUIStore_) {
        this.SET_UI_STORE(flowUIStore_);
    }
    async setCurrentFlowScenario(scenario) {
        var _a;
        this.SET_CURRENT_SCENARIO(scenario);
        (_a = this.flowUIStore_) === null || _a === void 0 ? void 0 : _a.enableSection({ visualization: !!scenario, export: !!scenario });
        await this.getViewsByScenario(scenario.uuid);
    }
    async getDatasets(projectUUID) {
        var _a, _b, _c;
        const activeProjectUUID = ((_a = this.project) === null || _a === void 0 ? void 0 : _a.uuid) || projectUUID, datasets = activeProjectUUID
            ? (_c = (await ((_b = this.backend) === null || _b === void 0 ? void 0 : _b.dataset.list(activeProjectUUID)))) !== null && _c !== void 0 ? _c : []
            : [];
        return datasets;
    }
    async getScenariosByProject(projectUUID) {
        var _a, _b, _c;
        const activeProjectUUID = projectUUID !== null && projectUUID !== void 0 ? projectUUID : (_a = this.project) === null || _a === void 0 ? void 0 : _a.uuid, scenarios = activeProjectUUID
            ? (_c = (await ((_b = this.backend) === null || _b === void 0 ? void 0 : _b.scenario.list(activeProjectUUID)))) !== null && _c !== void 0 ? _c : []
            : [];
        this.SET_SCENARIOS(scenarios);
        return scenarios;
    }
    async getViewsByScenario(scenarioUUID) {
        var _a, _b, _c;
        const currentScenarioUUID = scenarioUUID !== null && scenarioUUID !== void 0 ? scenarioUUID : (_a = this.scenario) === null || _a === void 0 ? void 0 : _a.uuid;
        if (currentScenarioUUID) {
            const views = (_c = (await ((_b = this.backend) === null || _b === void 0 ? void 0 : _b.view.list(currentScenarioUUID)))) !== null && _c !== void 0 ? _c : [];
            this.SET_VIEWS(views);
            return views;
        }
        return [];
    }
    async getScenario(activeScenarioUUID) {
        var _a;
        if (activeScenarioUUID) {
            return await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.scenario.get(activeScenarioUUID));
        }
        return null;
    }
    setTimestamp(value) {
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
    async getDatasetSummary(params) {
        var _a, _b, _c, _d, _e;
        const { datasetUUID } = params;
        let { scenarioUUID } = params;
        scenarioUUID !== null && scenarioUUID !== void 0 ? scenarioUUID : (scenarioUUID = (_a = this.scenario) === null || _a === void 0 ? void 0 : _a.uuid);
        let summary;
        summary = scenarioUUID
            ? (_b = this.scenarioSummaries[scenarioUUID]) === null || _b === void 0 ? void 0 : _b[datasetUUID]
            : this.datasetSummaries[datasetUUID];
        if (!summary) {
            summary =
                (_e = (scenarioUUID
                    ? await ((_c = this.backend) === null || _c === void 0 ? void 0 : _c.summary.getScenario(scenarioUUID, datasetUUID))
                    : await ((_d = this.backend) === null || _d === void 0 ? void 0 : _d.summary.getDataset(datasetUUID)))) !== null && _e !== void 0 ? _e : null;
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
    clearSummaries() {
        this.CLEAR_SUMMARIES();
    }
    async exportFromConfig(payload) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        (_a = this.flowUIStore_) === null || _a === void 0 ? void 0 : _a.setLoading({ value: true, msg: 'Exporting data...' });
        const datasets = (_d = (await this.getDatasets((_c = (_b = this.project) === null || _b === void 0 ? void 0 : _b.uuid) !== null && _c !== void 0 ? _c : '<unknown project>'))) === null || _d === void 0 ? void 0 : _d.reduce((obj, curr) => {
            obj[curr.name] = curr;
            return obj;
        }, {});
        if (datasets && this.project && this.scenario && this.timelineInfo && this.backend) {
            await exportFromConfig({
                config: {
                    dataset: (_e = datasets[payload.datasetName]) !== null && _e !== void 0 ? _e : null,
                    projectName: (_f = this.project) === null || _f === void 0 ? void 0 : _f.display_name,
                    scenario: this.scenario,
                    entityName: payload.entityGroup,
                    timestamp: (_g = payload.timestamp) !== null && _g !== void 0 ? _g : this.timestamp
                },
                timelineInfo: this.timelineInfo,
                backend: this.backend
            });
        }
        (_h = this.flowUIStore_) === null || _h === void 0 ? void 0 : _h.setLoading({ value: false });
    }
    async resetFlowStore() {
        this.SET_PROJECTS([]);
        this.SET_CURRENT_PROJECT(null);
        this.SET_SCENARIOS([]);
        this.SET_CURRENT_SCENARIO(null);
        this.SET_TIMESTAMP(0);
        this.UPDATE_VISUALIZERS([]);
    }
    async createView({ scenarioUUID, view }) {
        var _a;
        return await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.view.create(scenarioUUID, view));
    }
    async getViews(scenarioUUID) {
        var _a;
        return await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.view.list(scenarioUUID));
    }
    async getView(viewUUID) {
        var _a;
        return await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.view.get(viewUUID));
    }
    async updateView({ viewUUID, view }) {
        var _a;
        return await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.view.update(viewUUID, view));
    }
    async deleteView(viewUUID) {
        var _a;
        return await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.view.delete(viewUUID));
    }
    /**
     * This function sets up the start of the flow, depending on the configuration.
     * The user can start the flow on different sections, each has a different config that is validated here.
     * If config is valid, we query the resources and set them up in the store so they're accessible in the component
     *
     * @param config
     */
    async setupFlowStore({ config, reset = true }) {
        var _a, _b, _c;
        if (reset) {
            this.resetFlowStore();
            this.clearSummaries();
        }
        if (!this.currentUser) {
            const user = await ((_a = this.backend) === null || _a === void 0 ? void 0 : _a.user.get());
            if (user) {
                this.SET_USER(user);
            }
        }
        if (!this.projects || !this.projects.length) {
            await this.getProjects();
        }
        const { currentProjectName, currentScenarioName, getProject = false, getScenario = false, disableCollapser = false } = config;
        // needs a project but doesn't provide project name
        if (getProject && !currentProjectName) {
            throw new Error('Project name not provided');
        }
        // project is not set and provides a project name
        if (!this.project && currentProjectName) {
            const currentProject = this.projects.find((p) => p.name === currentProjectName);
            if (currentProject === null || currentProject === void 0 ? void 0 : currentProject.uuid) {
                await this.setCurrentFlowProject(currentProject);
            }
            else {
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
                    }
                    else {
                        this.resetFlowStore();
                        throw new Error('Invalid full scenario');
                    }
                }
                else {
                    // scenario name is invalid
                    this.resetFlowStore();
                    throw new Error('Invalid short Scenario');
                }
            }
        }
        (_b = this.flowUIStore_) === null || _b === void 0 ? void 0 : _b.enableSection({
            datasets: this.hasProject,
            scenario: this.hasProject,
            visualization: this.hasScenario,
            export: this.hasScenario
        });
        (_c = this.flowUIStore_) === null || _c === void 0 ? void 0 : _c.setDisableCollapser(disableCollapser);
    }
};
__decorate([
    Mutation
], FlowStore.prototype, "UPDATE_VISUALIZERS", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_PROJECTS", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_CURRENT_PROJECT", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_CURRENT_SCENARIO", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_SCENARIOS", null);
__decorate([
    Mutation
], FlowStore.prototype, "UPDATE_VIEW", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_VIEWS", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_TIMESTAMP", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_USER", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_BACKEND", null);
__decorate([
    Mutation
], FlowStore.prototype, "SET_UI_STORE", null);
__decorate([
    Mutation
], FlowStore.prototype, "ADD_DATASET_SUMMARY", null);
__decorate([
    Mutation
], FlowStore.prototype, "CLEAR_SUMMARIES", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "updateCurrentView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "updateVisualizers", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getProjects", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setCurrentFlowProject", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setApiClient", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setUIStore", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setCurrentFlowScenario", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getDatasets", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getScenariosByProject", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getViewsByScenario", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getScenario", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setTimestamp", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getDatasetSummary", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "clearSummaries", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "exportFromConfig", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "resetFlowStore", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "createView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getViews", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "getView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "updateView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "deleteView", null);
__decorate([
    Action({ rawError: true })
], FlowStore.prototype, "setupFlowStore", null);
FlowStore = __decorate([
    Module({
        name: 'flow',
        namespaced: true
    })
], FlowStore);
export default FlowStore;
