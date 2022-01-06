import { Backend, UUID, View } from '@movici-flow-common/types';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators';

@Module({
  name: 'flowVisualization',
  namespaced: true
})
class FlowVisualizationStore extends VuexModule {
  // FlowVisualization
  visualizers: ComposableVisualizerInfo[] = [];
  view: View | null = null;
  views: View[] = [];
  timestamp = 0;
  // injected resources
  backend_: Backend | null = null;

  get backend() {
    return this.backend_;
  }

  @Mutation
  SET_BACKEND(backend: Backend) {
    this.backend_ = backend;
  }

  @Mutation
  UPDATE_VISUALIZERS(visualizers: ComposableVisualizerInfo[]) {
    this.visualizers = visualizers;
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

  @Action({ rawError: true })
  setApiClient(backend: Backend) {
    this.SET_BACKEND(backend);
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
  async getViewsByScenario(scenarioUUID?: string): Promise<View[]> {
    if (scenarioUUID) {
      const views = (await this.backend?.view.list(scenarioUUID)) ?? [];
      this.SET_VIEWS(views);
      return views;
    }

    return [];
  }

  @Action({ rawError: true })
  setTimestamp(value: number) {
    this.SET_TIMESTAMP(value);
  }

  @Action({ rawError: true })
  async resetFlowStore() {
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
}

export default FlowVisualizationStore;
