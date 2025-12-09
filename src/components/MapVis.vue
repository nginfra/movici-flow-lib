<template>
  <Deck
    ref="deck"
    :modelValue="viewState"
    @update:modelValue="updateViewState($event)"
    :layers="layers"
    :basemap="basemap"
  >
    <template #map="{ map }">
      <o-loading full-page :active="isLoading" icon-size="large" />
      <Buildings v-if="buildings" :map="map" />
      <Scale v-if="scale" :map="map" />
    </template>
    <template #control-zero="deckProps">
      <DeckErrorHandling :on="deckProps.on" :layerInfos="visualizerInfos" />
      <slot name="control-zero" v-bind="{ ...slotProps, ...deckProps }" />
    </template>
    <template #control-left="deckProps">
      <slot name="control-left" v-bind="{ ...slotProps, ...deckProps }" />
    </template>
    <template #control-right="deckProps">
      <slot name="control-right" v-bind="{ ...slotProps, ...deckProps }" />
    </template>
    <template #control-bottom="deckProps">
      <slot name="control-bottom" v-bind="{ ...slotProps, ...deckProps }" />
    </template>
  </Deck>
</template>

<script setup lang="ts">
import type { Layer } from "@deck.gl/core";
import type { BoundingBox } from "@movici-flow-lib/crs";
import { useMoviciSettings } from "@movici-flow-lib/baseComposables/useMoviciSettings";
import { useDeckGL } from "@movici-flow-lib/composables/useDeckGL";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { useSummaryStore } from "@movici-flow-lib/stores/summary";
import type { DeckMouseEvent, PopupContent, ViewState } from "@movici-flow-lib/types";
import { DatasetDownloader } from "@movici-flow-lib/utils/DatasetDownloader";
import { getVisualizer, type Visualizer } from "@movici-flow-lib/visualizers";
import { TapefileStoreCollection } from "@movici-flow-lib/visualizers/TapefileStore";
import type { ComposableVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import VisualizerManager from "@movici-flow-lib/visualizers/VisualizerManager";
import { computed, markRaw, ref, watch } from "vue";
import Deck from "./Deck.vue";
import Buildings from "./mapControls//MapLayerBuildings.vue";
import DeckErrorHandling from "./mapControls/DeckErrorHandling.vue";
import Scale from "./mapControls/MapControlScale.vue";

const store = useFlowStore();
const { getSummary } = useSummaryStore();
const props = withDefaults(
  defineProps<{
    visualizerInfos: ComposableVisualizerInfo[];
    viewState?: ViewState;
    timestamp?: number;
    buildings?: boolean;
    scale?: boolean;
  }>(),
  {
    layerInfos: () => [],
    timestamp: 0,
    viewState: () => useMoviciSettings().settings.defaultViewState,
  }
);
const emit = defineEmits<{
  (e: "update:timestamp", val: number): void;
  (e: "update:viewState", val: ViewState): void;
}>();
const { basemap, layers, popup, deck } = useDeckGL();

const tapefileStores: TapefileStoreCollection = new TapefileStoreCollection();
const visualizers: VisualizerManager<ComposableVisualizerInfo, Visualizer> = new VisualizerManager<
  ComposableVisualizerInfo,
  Visualizer
>({
  backend: store.backend!,
  tapefileStores,
  visualizerFactory: createComposableVisualizer,
  onSuccess: () => {
    isLoading.value = false;
    updateLayers();
  },
  onError: () => {
    isLoading.value = false;
  },
  onDelete: ({ info }) => {
    if (info?.id) {
      popup.layerIsRemoved(info.id);
    }
  },
  onData: ({ timestamp }) => {
    if (timestamp != undefined) {
      maxTimeAvailable.value = timestamp;
      updateLayers();
    }
  },
});

const isLoading = ref(true);
const maxTimeAvailable = ref<number>();

const slotProps = computed(() => {
  return {
    tapefileStores,
    visualizers,
    popup,
    basemap: basemap.value,
    maxTimeAvailable: maxTimeAvailable.value,

    setBasemap: (val: string) => (basemap.value = val),
    updateTimestamp: (t: number) => emit("update:timestamp", t),
  };
});

watch(
  () => props.visualizerInfos,
  async (infos) => {
    isLoading.value = true;

    await visualizers.updateVisualizers(
      await Promise.all(
        infos.map(async (info) => {
          if (info.datasetUUID) {
            info.summary ??= await getSummary({
              datasetUUID: info.datasetUUID,
              scenarioUUID: info.scenarioUUID,
            });
          }

          return info;
        })
      )
    );
  },
  { immediate: true }
);

function updateLayers() {
  if (isLoading.value) {
    return;
  }

  const newLayers = visualizers
    .getVisualizers()
    .reverse() // Reverse the array so that layers are rendered correctly on top of each other
    .map((v) => {
      if (!v.info.visible) {
        popup.layerIsHidden(v.info.id);
      }

      v.setCallbacks({
        onClick: (content: PopupContent | null, ev?: DeckMouseEvent) => {
          if (ev?.leftButton && content) {
            popup.onClick(content, v.info.id);
          }
        },
        onHover: (content: PopupContent | null) => {
          popup.onHover(content, v.info.id);
        },
      });

      return v.getLayer(props.timestamp);
    })
    .filter((l) => l !== null) as Layer[];
  layers.value = markRaw(newLayers);
}
watch(() => props.timestamp, updateLayers);

function updateViewState(viewState: ViewState) {
  emit("update:viewState", viewState);
}

function zoomToBBox(bounding_box: BoundingBox, ratio?: number) {
  deck.value?.zoomToBBox(bounding_box, ratio);
}

defineExpose({ zoomToBBox });

function createComposableVisualizer(
  layerInfo: ComposableVisualizerInfo,
  manager: VisualizerManager<ComposableVisualizerInfo, Visualizer>
): Visualizer {
  if (!layerInfo.datasetUUID) {
    throw new Error(`Invalid dataset ${layerInfo.datasetName} for layer ${layerInfo.id}: no UUID`);
  }
  const datasetStore = new DatasetDownloader({
    backend: manager.backend,
    datasetUUID: layerInfo.datasetUUID,
    scenarioUUID: layerInfo.scenarioUUID || undefined,
  });
  const scenarioUUID = layerInfo.scenarioUUID ?? "";
  return getVisualizer({
    datasetStore,
    tapefileStore: manager.tapefileStores.ensure(scenarioUUID),
    info: layerInfo,
  });
}
</script>

<style scoped lang="scss">
.timeslider {
  flex-grow: 1;
  margin: 0 80px;
}
</style>
