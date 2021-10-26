<template>
  <FlowContainer class="flow-visualization">
    <template #leftPanel>
      <ProjectInfoBox class="mb-2" />
      <ScenarioInfoBox class="mb-2" />
      <ViewInfoBox
        class="mb-3"
        :name.sync="viewName"
        @load-view="loadView"
        @delete-view="confirmDeleteView"
        @save-view="confirmSaveView"
        @save-view-as-new="saveViewAsNew"
        @reset-view="confirmResetViewWithName"
      />
      <b-tabs
        ref="tabs"
        class="flow-tabs uppercase field is-flex-grow-0 is-flex-shrink-2"
        :style="tabHeight"
      >
        <b-tab-item :label="$t('flow.visualization.tabs.visualizers')">
          <FlowLayerPicker
            v-model="visualizers"
            :scenario="currentScenario"
            :timestamp="timestamp"
          ></FlowLayerPicker>
        </b-tab-item>
        <b-tab-item disabled :label="$t('flow.visualization.tabs.kpi')"></b-tab-item>
      </b-tabs>
    </template>
    <template #mainView>
      <MapVis
        :layer-infos="visualizers"
        :view-state.sync="viewState"
        :timestamp.sync="timestamp"
        buildings
      >
        <template #control-zero="{ map, dynamicPopup, popupContent, closePopup }">
          <DynamicDataView
            v-if="popupContent && dynamicPopup"
            :value="popupContent"
            :map="map"
            :view-state="viewState"
            :borderPadding="popupBorderPadding"
          >
            <DataViewContent @close="closePopup" :value="popupContent" :timestamp="timestamp" />
          </DynamicDataView>
        </template>
        <template #control-left="{ map, onViewstateChange, basemap, setBasemap }">
          <SearchBar
            v-if="hasGeocodeCapabilities"
            :map="map"
            :view-state="viewState"
            @update:view-state="onViewstateChange($event)"
          />
          <NavigationControl :value="viewState" @input="onViewstateChange($event)" />
          <BaseMapControl :value="basemap" @input="setBasemap" />
        </template>
        <template #control-right="{ popupContent, dynamicPopup, closePopup }">
          <FlowLegend v-if="visualizers.length" :value="visualizers" />
          <StaticDataView v-if="popupContent && !dynamicPopup">
            <DataViewContent @close="closePopup" :value="popupContent" :timestamp="timestamp" />
          </StaticDataView>
        </template>
        <template #control-bottom="{ updateTimestamp }">
          <TimeSlider
            :value="timestamp"
            @input="updateTimestamp($event)"
            :timeline-info="timelineInfo"
          />
        </template>
      </MapVis>
    </template>
  </FlowContainer>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import {
  CameraOptions,
  TimeOrientedSimulationInfo,
  UUID,
  View,
  VisualizationMode
} from '@/flow/types';
import MapVis from '@/flow/components/map/MapVis.vue';
import FlowContainer from './FlowContainer.vue';
import defaults from '@/flow/components/map/defaults';
import { ComposableVisualizerInfo } from '@/flow/visualizers/VisualizerInfo';
import FlowLayerPicker from '@/flow/components/widgets/FlowLayerPicker.vue';
import DynamicDataView from '@/flow/components/map_widgets/DynamicDataView.vue';
import DataViewContent from '@/flow/components/map_widgets/DataViewContent.vue';
import StaticDataView from '@/flow/components/map_widgets/StaticDataView.vue';
import ProjectInfoBox from './info_box/ProjectInfoBox.vue';
import ScenarioInfoBox from './info_box/ScenarioInfoBox.vue';
import ViewInfoBox from './info_box/ViewInfoBox.vue';
import SearchBar from '@/flow/components/map/controls/SearchBar.vue';
import NavigationControl from '@/flow/components/map/controls/NavigationControl.vue';
import BaseMapControl from '@/flow/components/map/controls/BaseMapControl.vue';
import TimeSlider from '@/flow/components/map_widgets/TimeSlider.vue';
import { simplifiedCamera, visualizerSettingsValidator } from '@/flow/visualizers/viewHelpers';
import { getEntitySummary } from '@/flow/utils';
import isEqual from 'lodash/isEqual';
import isError from 'lodash/isError';
import FlowLegend from './map_widgets/FlowLegend.vue';
import { successMessage } from '@/flow/utils/snackbar';
import { flowStore, flowUIStore } from '@/flow/store/store-accessor';

@Component({
  components: {
    FlowLayerPicker,
    FlowContainer,
    MapVis,
    ProjectInfoBox,
    ScenarioInfoBox,
    ViewInfoBox,
    SearchBar,
    NavigationControl,
    BaseMapControl,
    TimeSlider,
    DynamicDataView,
    StaticDataView,
    DataViewContent,
    FlowLegend
  },
  beforeRouteLeave(to: unknown, from: unknown, next: () => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((this as any).hasPendingChanges) {
      this.$buefy.dialog.confirm({
        message: '' + this.$t('flow.visualization.dialogs.unsavedView'),
        cancelText: '' + this.$t('actions.cancel'),
        confirmText: '' + this.$t('actions.leave'),
        type: 'is-danger',
        onConfirm: () => {
          next();
        }
      });
    } else {
      next();
    }
  }
})
export default class FlowVisualization extends Vue {
  @Prop([String]) currentProjectName?: string;
  @Prop([String]) currentScenarioName?: string;
  @Prop([String]) currentViewUUID?: UUID;
  @Ref('tabs') readonly tabs?: Vue;
  tabHeight: Partial<CSSStyleDeclaration> = {};

  // mapVis vars
  viewName = 'Untitled';
  viewState: CameraOptions = defaults.viewState();

  get view(): View | null {
    return flowStore.view;
  }

  set view(view: View | null) {
    flowStore.updateCurrentView(view);
  }

  get visualizers() {
    return flowStore.visualizers;
  }

  set visualizers(updatedCVIs: ComposableVisualizerInfo[]) {
    flowStore.updateVisualizers(updatedCVIs);
  }

  get currentProject() {
    return flowStore.project;
  }

  get currentScenario() {
    return flowStore.scenario;
  }

  // Map Vis getters
  get timelineInfo(): TimeOrientedSimulationInfo | null {
    return flowStore.timelineInfo;
  }

  get timestamp() {
    return flowStore.timestamp;
  }

  set timestamp(val: number) {
    flowStore.setTimestamp(val);
  }

  get popupBorderPadding() {
    return {
      left: flowUIStore.collapse ? 0 : 300
    };
  }

  get hasPendingChanges() {
    return !this.view
      ? this.visualizers.length || this.viewName !== 'Untitled'
      : isEqual(this.serializeCurrentView(), this.view);
  }

  get hasGeocodeCapabilities() {
    return flowStore.hasGeocodeCapabilities;
  }

  async reloadWithViewUrl(viewUUID: string) {
    await this.$router.push({
      name: 'FlowVisualization',
      query: {
        project: this.currentProject?.name,
        scenario: this.currentScenario?.name,
        view: viewUUID
      }
    });
  }

  /**
   * set the state of the visualization (visualizers, camera, etc) from a `FlowViewConfig` object
   * Visualizer config errors (such as invalid dataset or entity group) are logged and the
   * associated visualizer is not created
   * TODO: in a later stage, add the errors to the visualizer info and show them somewhere in the
   *   ui like we do in webviz
   */
  async loadView(view: View) {
    // just update in case it's different
    if (view.uuid && view.uuid !== this.currentViewUUID) {
      this.reloadWithViewUrl(view.uuid);
    }

    this.view = view;

    const datasets =
      this.currentScenario?.datasets.reduce((obj, d) => {
        obj[d.name] = d.uuid;
        return obj;
      }, {} as Record<string, UUID>) ?? {};

    const visualizers: ComposableVisualizerInfo[] = [];
    for (let vizConfig of view.config.visualizers) {
      const info = new ComposableVisualizerInfo({
        name: vizConfig.name,
        datasetName: vizConfig.dataset_name,
        datasetUUID: datasets[vizConfig.dataset_name],
        scenarioUUID: this.currentScenario?.uuid,
        entityGroup: vizConfig.entity_group,
        visible: vizConfig.visible,
        settings: vizConfig.settings,
        mode: VisualizationMode.SCENARIO
      });

      if (await this.validateForContentErrors(info)) {
        visualizers.push(info);
      }
    }

    this.viewName = view.name;
    this.visualizers = visualizers;

    if (view.config.camera) {
      this.viewState = view.config.camera;
    }

    if (typeof view.config.timestamp === 'number') {
      this.timestamp = view.config.timestamp;
    }
  }

  saveViewAsNew() {
    delete this.view?.uuid;
    this.confirmSaveView();
  }

  async confirmSaveView() {
    const view = this.serializeCurrentView(),
      viewUUID = this.view?.uuid,
      name = view.name;

    if (viewUUID && name) {
      this.$buefy.dialog.confirm({
        message:
          '' +
          this.$t('flow.visualization.dialogs.confirmOverwriteView', {
            name
          }),
        cancelText: '' + this.$t('actions.cancel'),
        confirmText: '' + this.$t('misc.yes'),
        type: 'is-primary',
        onConfirm: () => this.updateView({ view, viewUUID }).then(() => {})
      });
    } else {
      const resp = await this.createView({ view });

      if (resp && resp.uuid) {
        await this.reloadWithViewUrl(resp.uuid);
      }
    }
  }

  async confirmDeleteView() {
    const viewName = this.view?.name,
      viewUUID = this.view?.uuid;

    if (viewUUID && viewName) {
      this.$buefy.dialog.confirm({
        message:
          '' +
          this.$t('flow.visualization.dialogs.confirmDeleteView', {
            name: viewName
          }),
        cancelText: '' + this.$t('actions.cancel'),
        confirmText: '' + this.$t('misc.yes'),
        type: 'is-danger',
        onConfirm: () => this.deleteView({ viewUUID }).then(() => {})
      });
    } else {
      this.$buefy.dialog.alert('' + this.$t('flow.visualization.dialogs.noViewToDelete'));
    }
  }

  async updateView({ view, viewUUID }: { view: View; viewUUID: UUID }) {
    const resp = await flowStore.updateView({ viewUUID, view });
    if (resp) {
      successMessage('' + this.$t('flow.visualization.dialogs.viewUpdateSuccess'));
    }
  }

  async deleteView({ viewUUID }: { viewUUID: UUID }) {
    const resp = await flowStore.deleteView(viewUUID);
    if (resp) {
      successMessage('' + this.$t('flow.visualization.dialogs.viewDeleteSuccess'));
    }
    this.resetView();
  }

  async createView({ view }: { view: View }) {
    if (this.currentScenario?.uuid) {
      const resp = await flowStore.createView({
        scenarioUUID: this.currentScenario.uuid,
        view
      });

      if (resp) {
        successMessage('' + this.$t('flow.visualization.dialogs.viewCreateSuccess'));
        this.view = { ...view, uuid: resp.view_uuid };

        return this.view;
      }
    } else {
      throw new Error('Cannot save View without a scenario');
    }
  }

  async validateForContentErrors(info: ComposableVisualizerInfo) {
    info.unsetError('content');
    try {
      if (!info.datasetUUID) {
        throw new Error(
          `Dataset ${info.datasetName} is not available in scenario or user not authorized`
        );
      }

      const datasetSummary = await flowStore.getDatasetSummary({
        datasetUUID: info.datasetUUID,
        scenarioUUID: info.scenarioUUID
      });

      if (!datasetSummary) {
        throw new Error('Could not contact server for dataset information');
      }

      const entitySummary = getEntitySummary(info.entityGroup, datasetSummary);
      if (!entitySummary) {
        throw new Error(
          `Entity group ${info.entityGroup} not found in dataset ${info.datasetName}`
        );
      }
      visualizerSettingsValidator(entitySummary)(info);
    } catch (e) {
      if (isError(e)) {
        info.setError('content', e.message);
      }
      console.error(e);
      return false;
    }
    return true;
  }

  serializeCurrentView(exportCamera = true): View {
    const rv: View = {
      name: this.viewName,
      config: {
        version: 1,
        timestamp: this.timestamp,
        visualizers: this.visualizers.map(info => info.toVisualizerConfig())
      }
    };

    if (exportCamera) {
      rv.config.camera = simplifiedCamera(this.viewState);
    }

    return rv;
  }

  async confirmResetViewWithName() {
    const { name, uuid } = this.view ?? {};

    let message = null;
    if (uuid && name) {
      message = '' + this.$t('flow.visualization.dialogs.confirmResetViewWithName', { name });
    } else if (this.visualizers.length) {
      message = '' + this.$t('flow.visualization.dialogs.confirmResetViewWithoutName');
    }

    if (message !== null) {
      this.$buefy.dialog.confirm({
        message,
        cancelText: '' + this.$t('actions.cancel'),
        confirmText: '' + this.$t('misc.yes'),
        type: 'is-danger',
        onConfirm: () => this.resetView()
      });
    } else {
      this.resetView();
    }
  }

  async updateTabHeight() {
    await this.$nextTick();
    const top = this.tabs?.$el.getBoundingClientRect().top ?? 260;
    this.tabHeight = { height: `calc(100vh - 2rem - ${top}px)` };
  }

  resetView() {
    this.view = null;
    this.viewName = 'Untitled';
    this.visualizers = [];
  }

  /**
   * Checks whether there are props for project and scenario.
   * If there is a project, we set in the component, which triggers the watcher
   * Else, redirect to beginning of Flow.
   *
   * If there's also a prop for scenario, set that scenario in the component
   * TODO: validate scenario status, otherwise redirect to scenario config
   */
  async mounted() {
    const config = {
      currentProjectName: this.currentProjectName,
      getProject: true,
      currentScenarioName: this.currentScenarioName,
      getScenario: true
    };

    flowUIStore.setLoading({ value: true, msg: 'Loading visualization...' });

    try {
      await flowStore.setupFlowStore({ config, reset: false });

      let view = flowStore.view;
      if (!view && this.currentViewUUID && this.currentScenario) {
        const views = await flowStore.getViewsByScenario(this.currentScenario.uuid);
        view = views.find(v => v.uuid === this.currentViewUUID) ?? null;
      }

      if (view) {
        await this.loadView(view);
      }

      flowUIStore.setLoading({ value: false });
      this.updateTabHeight();
    } catch (error) {
      console.error(error);

      await this.$router.push({ name: 'FlowProjects' });
      flowUIStore.setLoading({ value: false });
    }
  }
}
</script>

<style scoped lang="scss"></style>
