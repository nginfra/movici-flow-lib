<template>
  <FlowContainer class="flow-visualization">
    <template #leftPanel>
      <ProjectInfoBox class="mb-2" v-if="hasProjectsCapabilities" />
      <ScenarioInfoBox class="mb-2" />
      <ViewInfoBox
        class="mb-3"
        :name.sync="viewName"
        @load-view="loadView"
        @delete-view="confirmDeleteView"
        @save-view="confirmSaveView"
        @save-view-as-new="saveViewAsNew"
        @reset-view="confirmResetViewWithName"
      >
        <template #quickSave>
          <span class="is-relative quick-save-container">
            <b-button
              icon-pack="fak"
              icon-left="fa-mov-save"
              size="is-small"
              @click="saveView(view.uuid)"
              class="py-0 is-transparent is-borderless quick-save"
              :title="isDirtyLabel"
            >
            </b-button>
            <div v-if="isCurrentViewDirty" class="notification-marker"></div>
          </span>
        </template>
      </ViewInfoBox>
      <b-tabs
        :value="visualizerTabOpen"
        @input="
          changeVisualizer({
            tab: $event,
            index: -2
          })
        "
        ref="tabs"
        class="flow-tabs uppercase field is-flex-grow-0 is-flex-shrink-2"
        :style="tabHeight"
      >
        <b-tab-item :label="$t('flow.visualization.tabs.visualizers')">
          <FlowLayerPicker
            ref="layerPicker"
            v-model="visualizers"
            :open.sync="visualizerOpen"
            :scenario="currentScenario"
            :timestamp="timestamp"
          />
        </b-tab-item>
        <b-tab-item :label="$t('flow.visualization.tabs.charts')">
          <FlowChartPicker v-model="charts" :open.sync="visualizerOpen" />
        </b-tab-item>
      </b-tabs>
    </template>
    <template #mainView>
      <MapVis
        ref="mapVis"
        v-if="viewState"
        :layer-infos="validVisualizers"
        :view-state.sync="viewState"
        :timestamp.sync="timestamp"
        buildings
        scale
      >
        <template
          #control-zero="{ map, popup, contextPickInfo, resetContextPickInfo, visualizers }"
        >
          <MapContextMenu
            v-if="getContextMenuActions(contextPickInfo).length"
            :value="contextPickInfo"
            :map="map"
            :view-state="viewState"
            :actions="getContextMenuActions(contextPickInfo)"
            @chartAttributePicker="openChart(contextPickInfo, visualizers)"
            @close="resetContextPickInfo"
          />
          <template v-if="popup.mapPopups.length">
            <MapEntityPopup
              v-for="(p, i) in popup.mapPopups"
              :value="p"
              :key="i"
              :map="map"
              :timestamp="timestamp"
              :view-state="viewState"
              @toggle="popup.togglePosition(p)"
              @close="popup.remove(p)"
              @click="popup.moveToTop(p)"
            />
          </template>
        </template>
        <template #control-left="{ map, onViewstateChange, basemap, setBasemap }">
          <SearchBar
            v-if="hasGeocodeCapabilities"
            :map="map"
            :view-state="viewState"
            @update:view-state="onViewstateChange($event)"
          />
          <NavigationControl
            :value="viewState"
            :center-camera="centerCamera"
            @input="onViewstateChange($event)"
          />
          <BaseMapControl :value="basemap" @input="setBasemap" />
        </template>
        <template #control-right="{ popup }">
          <FlowLegend v-if="visualizers.length" :value="visualizers" />
          <template v-if="popup.rightSidePopups.length">
            <RightSidePopup
              v-for="(p, i) in popup.rightSidePopups"
              :value="p"
              :key="i"
              :timestamp="timestamp"
              @toggle="popup.togglePosition(p)"
              @close="popup.remove(p)"
            />
          </template>
        </template>
        <template #control-bottom="{ updateTimestamp, maxTimeAvailable, tapefileStores }">
          <div class="box box-width-100" :class="{ 'pt-2': chartVisExpanded }">
            <ChartVis
              v-model="charts"
              :currentChartId.sync="chartVisOpen"
              :expanded.sync="chartVisExpanded"
              :tapefileStores="tapefileStores"
              :timelineInfo="timelineInfo"
              :timestamp="timestamp"
              :customTimeFormat="customTimeFormat"
              @openConfig="chartConfigOpen = $event"
            />
            <TimeSlider
              :value="timestamp"
              @input="updateTimestamp($event)"
              :customTimeFormat="customTimeFormat"
              :type="timestamp < maxTimeAvailable ? 'is-primary' : 'is-dark'"
              :timeline-info="timelineInfo"
            />
          </div>
        </template>
      </MapVis>
    </template>
  </FlowContainer>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import {
  ActionMenuItem,
  CameraOptions,
  DeckEntityObject,
  Nullable,
  TimeOrientedSimulationInfo,
  UUID,
  View
} from '../types';
import MapVis from './map/MapVis.vue';
import FlowContainer from './FlowContainer.vue';
import ChartVis from './charts/ChartVis.vue';
import defaults from './map/defaults';
import {
  BaseVisualizerInfo,
  ChartVisualizerInfo,
  ChartVisualizerItem,
  ComposableVisualizerInfo
} from '../visualizers/VisualizerInfo';
import FlowLayerPicker from './widgets/FlowLayerPicker.vue';
import ProjectInfoBox from './info_box/ProjectInfoBox.vue';
import ScenarioInfoBox from './info_box/ScenarioInfoBox.vue';
import ViewInfoBox from './info_box/ViewInfoBox.vue';
import SearchBar from './map/controls/SearchBar.vue';
import NavigationControl from './map/controls/NavigationControl.vue';
import BaseMapControl from './map/controls/BaseMapControl.vue';
import MapContextMenu from './map_widgets/MapContextMenu.vue';
import TimeSlider from './map_widgets/TimeSlider.vue';
import { simplifiedCamera, validateForContentErrors } from '../visualizers/viewHelpers';
import { buildFlowUrl } from '../utils';
import isEqual from 'lodash/isEqual';
import FlowLegend from './map_widgets/legends/FlowLegend.vue';
import { successMessage } from '../utils/snackbar';
import { flowStore, flowUIStore, flowVisualizationStore } from '../store/store-accessor';
import { MoviciError } from '@movici-flow-common/errors';
import { transformBBox } from '@movici-flow-common/crs';
import isError from 'lodash/isError';
import MapEntityPopup from './map_widgets/MapEntityPopup.vue';
import RightSidePopup from './map_widgets/RightSidePopup.vue';
import { PickInfo } from '@deck.gl/core/lib/deck';
import FlowChartPicker from './charts/FlowChartPicker.vue';
import VisualizerManager from '@movici-flow-common/visualizers/VisualizerManager';
import { Visualizer } from '@movici-flow-common/visualizers';
import { isEmpty } from 'lodash';
import ChartAttributePicker from './charts/ChartAttributePicker.vue';

@Component({
  name: 'FlowVisualization',
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
    MapContextMenu,
    FlowLegend,
    MapEntityPopup,
    RightSidePopup,
    FlowChartPicker,
    ChartVis
  },
  beforeRouteLeave(to: unknown, from: unknown, next: () => void) {
    if ((this as FlowVisualization).isCurrentViewDirty) {
      this.$buefy.dialog.confirm({
        message: '' + this.$t('flow.visualization.dialogs.unsavedView'),
        cancelText: '' + this.$t('actions.cancel'),
        confirmText: '' + this.$t('actions.leave'),
        type: 'is-danger',
        onConfirm: () => {
          next();
        }
      });
    } else if ((this as FlowVisualization).visualizers.length) {
      this.$buefy.dialog.confirm({
        message: '' + this.$t('flow.visualization.dialogs.leaveView'),
        cancelText: '' + this.$t('actions.cancel'),
        confirmText: '' + this.$t('actions.leave'),
        type: 'is-warning',
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
  @Prop({ type: String }) readonly currentProjectName?: string;
  @Prop({ type: String }) readonly currentScenarioName?: string;
  @Prop({ type: String }) readonly currentViewUUID?: UUID;
  @Ref('tabs') readonly tabs?: Vue;
  @Ref('mapVis') readonly mapVisEl!: MapVis;
  @Ref('layerPicker') readonly layerPickerEl!: FlowLayerPicker;
  tabHeight: Partial<CSSStyleDeclaration> = {};
  isCurrentViewDirty = false;
  viewName = 'Untitled';
  viewState: Nullable<CameraOptions> = defaults.viewState();
  visualizerTabOpen = 0;
  visualizerOpen = -2;

  validVisualizers: ComposableVisualizerInfo[] = [];
  charts: ChartVisualizerInfo[] = [];
  chartVisOpen = '';
  chartVisExpanded = false;

  get views(): View[] {
    return flowVisualizationStore.views;
  }

  get view(): View | null {
    return flowVisualizationStore.view;
  }

  set view(view: View | null) {
    flowVisualizationStore.updateCurrentView(view);
  }

  get visualizers() {
    return flowVisualizationStore.visualizers;
  }

  set visualizers(updatedCVIs: ComposableVisualizerInfo[]) {
    flowVisualizationStore.updateVisualizers(updatedCVIs);
  }

  get currentProject() {
    return flowStore.project;
  }

  get centerCamera() {
    return this.view?.config.camera ?? defaults.viewState();
  }

  get currentScenario() {
    return flowStore.scenario;
  }

  // Map Vis getters
  get timelineInfo(): TimeOrientedSimulationInfo | null {
    return flowStore.timelineInfo;
  }

  get timestamp() {
    return flowVisualizationStore.timestamp;
  }

  set timestamp(val: number) {
    flowVisualizationStore.setTimestamp(val);
  }

  get hasPendingChanges() {
    const currentView = { ...this.view },
      serializedView = this.serializeCurrentView();

    return !isEqual(
      {
        visualizers: currentView.config?.visualizers,
        charts: currentView.config?.charts,
        name: currentView.name
      },
      {
        visualizers: serializedView.config?.visualizers,
        charts: serializedView.config?.charts,
        name: serializedView.name
      }
    );
  }

  get hasGeocodeCapabilities() {
    return flowStore.hasGeocodeCapabilities;
  }

  get hasProjectsCapabilities() {
    return flowStore.hasProjectsCapabilities;
  }

  get isDirtyLabel() {
    return this.isCurrentViewDirty
      ? this.$t('flow.visualization.unsavedChanges')
      : this.$t('flow.visualization.viewUpToDate');
  }

  async reloadWithViewUrl(viewUUID?: string, reload?: boolean) {
    await this.$router.push(
      buildFlowUrl('FlowVisualization', {
        project: this.currentProject?.name,
        scenario: this.currentScenario?.name,
        view: viewUUID
      })
    );

    if (reload) {
      this.$router.go(0);
    }
  }

  @Watch('chartConfigOpen')
  afterSetGraphConfig() {
    this.visualizerTabOpen = 1;
  }

  getContextMenuActions(info: PickInfo<unknown> | undefined): ActionMenuItem[] {
    return info?.layer
      ? [
          {
            label: 'Add attribute to a chart',
            event: 'chartAttributePicker',
            icon: 'chart-line'
          }
        ]
      : [];
  }

  openChart(
    pickInfo: PickInfo<DeckEntityObject<unknown>>,
    visualizers: VisualizerManager<ComposableVisualizerInfo, Visualizer>
  ) {
    const layerId = pickInfo.layer.id.split('-')[0],
      currentVisualizer = visualizers.getVisualizers().find(v => v.baseID === layerId);

    if (currentVisualizer) {
      const entityGroup = currentVisualizer.info.entityGroup,
        datasetName = currentVisualizer.info.datasetName,
        datasetUUID = currentVisualizer.info.datasetUUID;
      this.openChartAttributePicker({
        info: pickInfo,
        entityGroup,
        datasetName,
        datasetUUID,
        scenarioUUID: this.currentScenario?.uuid
      });
    }
  }

  async openChartAttributePicker({
    info,
    entityGroup,
    datasetName,
    datasetUUID,
    scenarioUUID
  }: {
    info: PickInfo<DeckEntityObject<unknown>>;
    entityGroup: string;
    datasetName: string;
    datasetUUID?: string | null;
    scenarioUUID?: string;
  }) {
    this.$buefy.modal.open({
      component: ChartAttributePicker,
      parent: this,
      width: 'max-content',
      canCancel: ['x', 'escape'],
      customClass: 'overflow-visible',
      props: {
        value: this.charts,
        object: info.object,
        datasetName,
        scenarioUUID,
        datasetUUID,
        entityGroup
      },
      events: {
        openConfig: (index: number) => {
          this.changeVisualizer({ tab: 1, index });
        },
        openChart: (id: string) => {
          this.chartVisOpen = id;
          this.chartVisExpanded = true;
        },
        input: (charts: ChartVisualizerInfo[]) => {
          this.charts = charts;
        }
      }
    });
  }

  changeVisualizer({ tab, index }: { tab: number; index: number }) {
    this.visualizerTabOpen = tab;
    this.visualizerOpen = index;
  }
  /**
   * set the state of the visualization (visualizers, camera, etc) from a `FlowViewConfig` object
   * Visualizer config errors (such as invalid dataset or entity group) are logged and the
   * associated visualizer is not created
   * TODO: in a later stage, add the errors to the visualizer info and show them somewhere in the
   *   ui like we do in webviz
   */
  async loadView(view: View) {
    // just reload in case it's different
    if (view.uuid && view.uuid !== this.currentViewUUID) {
      this.reloadWithViewUrl(view.uuid, true);
      return;
    }

    const datasets =
      this.currentScenario?.datasets.reduce((obj, d) => {
        obj[d.name] = d.uuid;
        return obj;
      }, {} as Record<string, UUID>) ?? {};

    const visualizers: ComposableVisualizerInfo[] = view.config.visualizers.map(config => {
      return ComposableVisualizerInfo.fromVisualizerConfig({
        config,
        datasets,
        scenario: this.currentScenario
      });
    });

    // When we can configure from view
    const charts: ChartVisualizerInfo[] = (view.config.charts ?? []).map(conf => {
      return new ChartVisualizerInfo({
        title: conf.title,
        attribute: conf.attribute,
        scenarioUUID: this.currentScenario?.uuid,
        settings: conf.settings,
        items: conf.items.map(item => {
          return new ChartVisualizerItem(item);
        })
      });
    });

    this.viewName = view.name;
    this.visualizers = visualizers;
    this.charts = charts;

    if (view.config.camera) {
      this.viewState = { ...view.config.camera, transitionDuration: 300 };
    }

    if (typeof view.config.timestamp === 'number') {
      this.timestamp = view.config.timestamp;
    }

    this.view = view;

    this.updateIsViewDirty(this.hasPendingChanges);
  }

  saveViewAsNew() {
    delete this.view?.uuid;
    this.confirmSaveView();
  }

  async saveView(viewUUID?: string) {
    const view = this.serializeCurrentView();
    if (viewUUID) {
      await this.updateView({ view, viewUUID });
    } else if (this.currentScenario?.uuid) {
      const resp = await this.createView({ view, scenarioUUID: this.currentScenario.uuid });
      if (resp?.uuid) {
        viewUUID = resp.uuid;
        await this.reloadWithViewUrl(resp.uuid);
      }
    }

    this.view = { ...view, uuid: viewUUID, scenario_uuid: this.currentScenario?.uuid };
    this.updateIsViewDirty(this.hasPendingChanges);
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
        onConfirm: () => {
          this.saveView(viewUUID).then(() => {});
        }
      });
    } else if (this.currentScenario?.uuid) {
      const resp = await this.createView({ view, scenarioUUID: this.currentScenario.uuid });

      if (resp && resp.uuid) {
        this.updateIsViewDirty(this.hasPendingChanges);
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
        onConfirm: () =>
          this.deleteView({ viewUUID }).then(() => {
            this.resetView();
            this.reloadWithViewUrl();
          })
      });
    } else {
      this.$buefy.dialog.alert('' + this.$t('flow.visualization.dialogs.noViewToDelete'));
    }
  }

  async updateView({ view, viewUUID }: { view: View; viewUUID: UUID }) {
    const resp = await flowVisualizationStore.updateView({ viewUUID, view });
    if (resp) {
      successMessage('' + this.$t('flow.visualization.dialogs.viewUpdateSuccess'));
    }
  }

  async deleteView({ viewUUID }: { viewUUID: UUID }) {
    const resp = await flowVisualizationStore.deleteView(viewUUID);
    if (resp) {
      successMessage('' + this.$t('flow.visualization.dialogs.viewDeleteSuccess'));
    }
    this.resetView();
  }

  async createView({ view, scenarioUUID }: { view: View; scenarioUUID: string }) {
    const resp = await flowVisualizationStore.createView({
      scenarioUUID,
      view
    });

    if (resp) {
      successMessage('' + this.$t('flow.visualization.dialogs.viewCreateSuccess'));
      this.view = { ...view, uuid: resp.view_uuid };
      return this.view;
    }
  }

  @Watch('viewName')
  @Watch('visualizers')
  @Watch('charts')
  onUpdateView() {
    this.updateIsViewDirty(this.hasPendingChanges);
  }

  updateIsViewDirty(newValue: boolean) {
    this.isCurrentViewDirty = newValue;
  }

  serializeCurrentView(exportCamera = true): View {
    const rv: View = {
      name: this.viewName,
      config: {
        version: 1,
        timestamp: this.timestamp,
        visualizers: this.visualizers.map(info => info.toVisualizerConfig()),
        charts: this.charts.map(info => info.toVisualizerConfig())
      }
    };

    if (exportCamera && this.viewState) {
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

  async resetView() {
    this.viewName = 'Untitled';
    this.visualizers = [];
    this.view = this.serializeCurrentView();
  }

  @Watch('visualizers', { immediate: true })
  resolveMapVisualizersDataset() {
    this.doResolveDatasets(this.visualizers);
  }

  @Watch('charts', { immediate: true })
  resolveChartVisualizersDataset() {
    this.doResolveDatasets(this.charts);
  }

  @Watch('visualizers')
  handleVisualizers() {
    Promise.all(
      this.visualizers.map(async info => {
        info.unsetError('content');

        try {
          const summary = info.datasetUUID
            ? await flowStore.getDatasetSummary({
                datasetUUID: info.datasetUUID,
                scenarioUUID: info.scenarioUUID
              })
            : null;
          validateForContentErrors(info, summary);
        } catch (e) {
          info.setError('content', isError(e) ? e.message : String(e));
        }
      })
    ).then(() => {
      this.validVisualizers = this.visualizers.filter(i => !isEmpty(i));
    });
  }

  doResolveDatasets(infos: BaseVisualizerInfo[]) {
    for (const vis of infos) {
      vis.unsetError('resolve');
      try {
        vis.resolveDatasets(flowStore.datasetsByName);
      } catch (error) {
        if (isError(error)) {
          vis.setError('resolve', error.message);
        }
      }
    }
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
    try {
      flowUIStore.setLoading({ value: true, msg: 'Loading visualization...' });

      if (this.currentViewUUID) {
        await this.resetView();
        const view = await flowVisualizationStore.getViewById(this.currentViewUUID);
        await flowStore.setupFlowStoreByView({
          view,
          config: {
            currentProjectName: this.currentProjectName,
            needProject: false,
            currentScenarioName: this.currentScenarioName,
            needScenario: false
          }
        });
        await this.loadView(view);
      } else {
        await flowStore.setupFlowStore({
          config: {
            currentProjectName: this.currentProjectName,
            needProject: true,
            currentScenarioName: this.currentScenarioName,
            needScenario: true
          },
          reset: false
        });

        if (this.currentScenario?.bounding_box) {
          this.mapVisEl.zoomToBBox(
            transformBBox(this.currentScenario.bounding_box, this.currentScenario.epsg_code)
          );
        }

        await this.resetView();
      }

      flowUIStore.setLoading({ value: false });
      this.updateTabHeight();
    } catch (error: unknown) {
      flowUIStore.setLoading({ value: false });
      this.updateIsViewDirty(false);
      if (error instanceof MoviciError) {
        await error.handleError({
          $t: this.$t.bind(this),
          $router: this.$router,
          query: {
            project: this.currentProjectName,
            scenario: this.currentScenarioName,
            view: this.view?.uuid
          }
        });
      }
    }
  }

  get customTimeFormat(): (val: number) => string {
    // Time format is customized in such a way that we have at least 20 distinct displayed moments
    // so starting from a total duration 20 years, we display only the year, from a duration of 2
    // year we display only the month and year, etc. These are rough estimates though, it's not
    // rocket science

    const duration = this.timelineInfo
      ? this.timelineInfo.duration * this.timelineInfo.time_scale
      : 0;
    let levelOfDetail: number;
    if (duration > 3600 * 24 * 365 * 20) {
      // longer than 20 years shows only year
      levelOfDetail = 1;
    } else if (duration > 3600 * 24 * 365 * 2) {
      // longer than 2 years shows month and year
      levelOfDetail = 2;
    } else if (duration > 3600 * 24 * 30) {
      // longer than 1 month shows day month and year
      levelOfDetail = 3;
    } else {
      // anything shorter than a month shows everything
      levelOfDetail = 10;
    }
    return (val: number) => formatDate(new Date(val * 1000), levelOfDetail);
  }
}

function formatDate(d: Date, levelOfDetail: number): string {
  if (levelOfDetail >= 10) {
    return d.toLocaleString('NL-nl');
  }
  let rv = '';
  if (levelOfDetail >= 1) {
    // YYYY
    rv = String(d.getFullYear());
  }
  if (levelOfDetail >= 2) {
    // MM-YYYY
    rv = ('0' + (d.getMonth() + 1)).slice(-2) + '-' + rv;
  }
  if (levelOfDetail >= 3) {
    // DD-MM-YYYY
    rv = ('0' + d.getDate()).slice(-2) + '-' + rv;
  }
  return rv;
}
</script>

<style scoped lang="scss">
.quick-save-container {
  .notification-marker {
    width: 0.3em;
    height: 0.3em;
    border-radius: 100%;
    background: $red;
    position: absolute;
    top: 5px;
    right: 5px;
  }
  .quick-save {
    color: $primary;
  }
}
.box-width-100 {
  width: 100%;
}
</style>
