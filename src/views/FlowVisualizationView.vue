<template>
  <FlowStep class="flow-visualization">
    <template #leftPanel>
      <ProjectInfoBox class="mb-2" v-if="store.hasCapability('projects')" />
      <ScenarioInfoBox class="mb-2" />
      <ViewInfoBox
        class="mb-3"
        v-model:name="viewName"
        @loadView="loadView"
        @saveView="saveView"
        @saveViewAsNew="saveNewView"
        @deleteView="confirmDeleteView"
      >
        <template #quickSave>
          <span class="is-relative quick-save-container">
            <o-button
              icon-pack="fak"
              icon-left="fa-mov-save"
              size="small"
              @click="saveView"
              class="py-0 is-transparent is-borderless quick-save has-text-primary has-hover-bg"
              :title="hasPendingChangesLabel"
            >
            </o-button>
            <div v-if="hasPendingChanges" class="notification-marker"></div>
          </span>
        </template>
      </ViewInfoBox>
      <o-tabs
        :modelValue="visualizerTabOpen"
        @update:modelValue="
          changeVisualizer({
            tab: $event,
            index: -2,
          })
        "
        ref="tabs"
        class="flow-tabs uppercase field is-flex-grow-0 is-flex-shrink-2"
        :style="tabHeight"
      >
        <o-tab-item :label="t('flow.visualization.tabs.visualizers')" :value="0">
          <FlowLayerPicker
            ref="layerPicker"
            v-model="parsedView.visualizerInfos"
            v-model:open="visualizerOpen"
            :scenario="scenario"
            :timestamp="parsedView.timestamp"
            @export="exportData($event)"
          />
        </o-tab-item>
        <o-tab-item :label="t('flow.visualization.tabs.charts')" :value="1">
          <FlowChartPicker v-model="parsedView.chartInfos" v-model:open="chartConfigOpen" />
        </o-tab-item>
      </o-tabs>
    </template>
    <template #mainView>
      <MapVis
        ref="mapVis"
        v-if="parsedView.camera"
        :visualizerInfos="visualizersWithSummary"
        v-model:camera="parsedView.camera"
        v-model:timestamp="parsedView.timestamp"
        buildings
        scale
      >
        <template
          #control-zero="{ map, popup, contextPickInfo, resetContextPickInfo, visualizers }"
        >
          <MapContextMenu
            v-if="contextPickInfo"
            :modelValue="contextPickInfo as PickingInfo<unknown>"
            :map="map"
            :camera="parsedView.camera"
            :actions="contextMenuActions"
            @add-chart="openChart(contextPickInfo, visualizers)"
            @close="resetContextPickInfo"
          />
          <template v-if="map && popup.mapPopups.length">
            <MapEntityPopup
              v-for="(p, i) in popup.mapPopups"
              :modelValue="p"
              :key="i"
              :map="map"
              :timestamp="parsedView.timestamp"
              :camera="parsedView.camera"
              @toggle="popup.toggleLocation(p)"
              @close="popup.remove(p)"
              @click="popup.moveToBottom(p)"
            />
          </template>
        </template>
        <template #control-left="{ map, onViewstateChange, basemap, setBasemap }">
          <MapControlSearchBar
            v-if="store.hasCapability('geocode')"
            :map="map"
            :camera="parsedView.camera"
            @update:camera="onViewstateChange($event)"
          />
          <MapControlNavigation
            :modelValue="parsedView.camera"
            @update:modelValue="onViewstateChange($event)"
            :initialCamera="parsedView.initialCamera"
          />
          <MapControlBaseMap :modelValue="basemap" @update:modelValue="setBasemap" />
        </template>
        <template #control-right="{ popup }">
          <FlowLegend
            v-if="parsedView.visualizerInfos.length"
            :modelValue="parsedView.visualizerInfos"
          />
          <template v-if="popup.rightSidePopups.length">
            <RightSidePopup
              v-for="(p, i) in popup.rightSidePopups"
              :modelValue="p"
              :key="i"
              :timestamp="parsedView.timestamp"
              @toggle="popup.toggleLocation(p)"
              @close="popup.remove(p)"
            />
          </template>
        </template>
        <template
          v-if="timelineInfo"
          #control-bottom="{ updateTimestamp, maxTimeAvailable, tapefileStores }"
        >
          <div class="box box-width-100" :class="{ 'pt-2': chartVisExpanded }">
            <ChartVis
              v-model="parsedView.chartInfos"
              v-model:activeChartId="activeChartId"
              v-model:expanded="chartVisExpanded"
              :tapefileStores="tapefileStores"
              :timelineInfo="timelineInfo"
              :timestamp="parsedView.timestamp"
              :customTimeFormat="customTimeFormat"
              @openConfig="changeVisualizer({ tab: 1, index: $event })"
            />
            <TimeSlider
              :modelValue="parsedView.timestamp"
              @update:modelValue="updateTimestamp($event)"
              :customTimeFormat="customTimeFormat"
              :type="timesliderVariant(maxTimeAvailable)"
              :timeline-info="timelineInfo"
            />
          </div>
        </template>
      </MapVis>
    </template>
  </FlowStep>
</template>

<script setup lang="ts">
import type { PickingInfo } from "@deck.gl/core";
import { useDialog } from "@movici-flow-lib/baseComposables/useDialog";
import { useSnackbar } from "@movici-flow-lib/baseComposables/useSnackbar";
import TimeSlider from "@movici-flow-lib/components/TimeSlider.vue";
import FlowChartPicker from "@movici-flow-lib/components/charts/FlowChartPicker.vue";
import FlowLegend from "@movici-flow-lib/components/mapControls/FlowLegend.vue";
import FlowExport from "@movici-flow-lib/components/FlowExport.vue";
import { useMapVis } from "@movici-flow-lib/composables/useMapVis";
import { useReactiveSummary } from "@movici-flow-lib/composables/useReactiveSummary";
import { useScenario } from "@movici-flow-lib/composables/useScenario";
import { useViews } from "@movici-flow-lib/composables/useViews";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import type { Visualizer } from "@movici-flow-lib/visualizers";
import type VisualizerManager from "@movici-flow-lib/visualizers/VisualizerManager";
import { MoviciColors, hexToColorTriple } from "@movici-flow-lib/visualizers/maps/colorMaps";
import { useProgrammatic } from "@oruga-ui/oruga-next";
import isError from "lodash/isError";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import FlowLayerPicker from "../components/FlowLayerPicker.vue";
import FlowStep from "../components/FlowStep.vue";
import MapVis from "../components/MapVis.vue";
import ProjectInfoBox from "../components/ProjectInfoBox.vue";
import ScenarioInfoBox from "../components/ScenarioInfoBox.vue";
import ViewInfoBox from "../components/ViewInfoBox.vue";
import ChartAttributePicker from "../components/charts/ChartAttributePicker.vue";
import ChartVis from "../components/charts/ChartVis.vue";
import MapContextMenu from "../components/mapControls/MapContextMenu.vue";
import MapControlBaseMap from "../components/mapControls/MapControlBaseMap.vue";
import MapControlNavigation from "../components/mapControls/MapControlNavigation.vue";
import MapControlSearchBar from "../components/mapControls/MapControlSearchBar.vue";
import MapEntityPopup from "../components/mapControls/MapEntityPopup.vue";
import RightSidePopup from "../components/mapControls/RightSidePopup.vue";
import type { DeckEntityObject } from "../types";
import type { ChartVisualizerItem, ComposableVisualizerInfo } from "../visualizers/VisualizerInfo";
import { BaseVisualizerInfo, ChartVisualizerInfo } from "../visualizers/VisualizerInfo";

const store = useFlowStore();
const { openDialog } = useDialog();
const { t } = useI18n();
const { successMessage } = useSnackbar();
const { oruga } = useProgrammatic();

defineProps<{
  hasPendingChanges?: boolean;
}>();
const emit = defineEmits<{
  (e: "update:hasPendingChanges", val: boolean): void;
}>();

const { datasets, datasetsByName } = useReactiveSummary();
const { scenario, timelineInfo } = useScenario({ datasets });

const {
  viewName,
  parsedView,
  hasPendingChanges: hasPendingChangesLocal,
  loadView,
  updateView,
  createView,
  deleteView,
} = useViews({
  initialViewName: "Untitled",
  scenario,
});
watch(hasPendingChangesLocal, (val) => emit("update:hasPendingChanges", val));

function confirmDeleteView() {
  openDialog({
    canCancel: true,
    hasIcon: true,
    onConfirm: deleteView,
    variant: "danger",
    message: t("flow.visualization.dialogs.confirmDeleteView", {
      name: viewName.value,
    }),

    cancelText: t("actions.cancel"),
    confirmButtonText: t("misc.yes"),
  });
}

async function saveView() {
  if (store.view) {
    if (await updateView()) {
      successMessage(t("flow.visualization.dialogs.viewUpdateSuccess"));
    }
    return;
  }
  await saveNewView();
}
async function saveNewView() {
  if (await createView()) {
    successMessage(t("flow.visualization.dialogs.viewCreateSuccess"));
  }
}

const hasPendingChangesLabel = computed(() => {
  return hasPendingChangesLocal.value
    ? t("flow.visualization.unsavedChanges")
    : t("flow.visualization.viewUpToDate");
});

const visualizerTabOpen = ref(0);
const visualizerOpen = ref(-2);
const chartConfigOpen = ref(-2);
function changeVisualizer({ tab, index }: { tab: number; index: number }) {
  visualizerTabOpen.value = tab;
  if (tab === 0) {
    visualizerOpen.value = index;
  } else if (tab === 1) {
    chartConfigOpen.value = index;
  }
}

const contextMenuActions = [
  {
    label: "Add attribute to a chart",
    event: "add-chart",
    icon: "chart-line",
  },
];
const activeChartId = ref<string>();
const chartVisExpanded = ref(false);

function addChartItem(item: ChartVisualizerItem): number {
  const infos = [...parsedView.chartInfos];
  let found = infos.findIndex((c) => c.attribute === item.attribute);
  item.color = suggestColor(infos[found] ?? null);

  if (found < 0) {
    found = infos.length;
    infos.push(
      new ChartVisualizerInfo({
        attribute: item.attribute,
        scenarioUUID: scenario.value?.uuid,
        title: item.attribute,
        items: [item],
      }),
    );
  } else {
    infos[found] = infos[found]!.addItem(item);
  }
  parsedView.chartInfos = infos;
  return found;
}
const colorPickerPresets = Object.values(MoviciColors);

function suggestColor(chart: ChartVisualizerInfo | null) {
  return hexToColorTriple(
    colorPickerPresets[(chart?.items.length ?? 0) % (colorPickerPresets.length - 1)]!,
  );
}

function openChart(
  pickInfo: PickingInfo<DeckEntityObject<unknown>>,
  visualizers: VisualizerManager<ComposableVisualizerInfo, Visualizer>,
) {
  const layerId = pickInfo.layer?.id.split("-")[0],
    currentVisualizer = layerId && visualizers.getVisualizers().find((v) => v.baseID === layerId);

  if (currentVisualizer) {
    const entityGroup = currentVisualizer.info.entityGroup,
      datasetName = currentVisualizer.info.datasetName,
      datasetUUID = currentVisualizer.info.datasetUUID;
    openChartAttributePicker({
      info: pickInfo,
      entityGroup,
      datasetName,
      datasetUUID,
      scenarioUUID: scenario.value?.uuid,
    });
  }
}

function openChartAttributePicker({
  info,
  entityGroup,
  datasetName,
  datasetUUID,
  scenarioUUID,
}: {
  info: PickingInfo<DeckEntityObject<unknown>>;
  entityGroup: string;
  datasetName: string;
  datasetUUID?: string | null;
  scenarioUUID?: string;
}) {
  oruga.modal.open({
    component: ChartAttributePicker,
    width: "max-content",
    canCancel: ["x", "escape"],
    props: {
      modelValue: parsedView.chartInfos,
      object: info.object,
      datasetName,
      scenarioUUID,
      datasetUUID,
      entityGroup,
    },
    events: {
      addChart: ([item, edit]: [ChartVisualizerItem, boolean?]) => {
        const index = addChartItem(item);
        activeChartId.value = parsedView.chartInfos[index]!.id;
        chartVisExpanded.value = true;
        if (edit || (visualizerTabOpen.value === 1 && chartConfigOpen.value === index)) {
          changeVisualizer({ tab: 1, index });
        }
      },
    },
  });
}

const { visualizersWithSummary } = useMapVis(computed(() => parsedView.visualizerInfos));

const tabHeight = null;

function timesliderVariant(maxTimeAvailable?: number) {
  return parsedView.timestamp == null ||
    maxTimeAvailable == null ||
    parsedView.timestamp > maxTimeAvailable
    ? "dark"
    : "primary";
}

function customTimeFormat(val: number): string {
  // Time format is customized in such a way that we have at least 20 distinct displayed moments
  // so starting from a total duration 20 years, we display only the year, from a duration of 2
  // year we display only the month and year, etc. These are rough estimates though, it's not
  // rocket science

  const duration = timelineInfo.value
    ? timelineInfo.value.duration * timelineInfo.value.time_scale
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
  return formatDate(new Date(val * 1000), levelOfDetail);
}
function formatDate(d: Date, levelOfDetail: number): string {
  if (levelOfDetail >= 10) {
    return d.toLocaleString("NL-nl");
  }
  let rv = "";
  if (levelOfDetail >= 1) {
    // YYYY
    rv = String(d.getFullYear());
  }
  if (levelOfDetail >= 2) {
    // MM-YYYY
    rv = ("0" + (d.getMonth() + 1)).slice(-2) + "-" + rv;
  }
  if (levelOfDetail >= 3) {
    // DD-MM-YYYY
    rv = ("0" + d.getDate()).slice(-2) + "-" + rv;
  }
  return rv;
}

watch(() => parsedView.visualizerInfos, doResolveDatasets, { immediate: true });
watch(() => parsedView.chartInfos, doResolveDatasets, { immediate: true });

function doResolveDatasets(infos: BaseVisualizerInfo[]) {
  for (const vis of infos) {
    vis.unsetError("resolve");
    try {
      vis.resolveDatasets(datasetsByName.value);
    } catch (error) {
      if (isError(error)) {
        vis.setError("resolve", error.message);
      }
    }
  }
}

function exportData(info?: ComposableVisualizerInfo) {
  oruga.modal.open({
    component: FlowExport,
    props: {
      modelValue: info,
    },
    width: "max-content",
    canCancel: ["x", "escape"],
  });
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

.tab-content {
  margin: 0;
  padding: 0;
  .tab-item {
    max-height: calc(100vh - 288px);
    overflow: auto;
    margin: 0.5rem -0.25rem 0.5rem 0;
    padding-right: 0.25rem;
  }
}
</style>
