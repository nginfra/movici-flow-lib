<template>
  <MapVis :visualizer-infos="layers" v-model:camera="camera" scale>
    <template #control-zero="{ map, popup }">
      <template v-if="popup.mapPopups.length && map">
        <MapEntityPopup
          v-for="(p, i) in popup.mapPopups"
          :modelValue="p"
          :key="i"
          :map="map"
          :camera="camera"
          @toggle="popup.toggleLocation(p)"
          @close="popup.remove(p)"
          @click="popup.moveToBottom(p)"
        />
      </template>
    </template>
    <template #control-left="{ map, onViewstateChange, basemap, setBasemap }">
      <MapControlSearchBar
        v-if="hasGeocodeCapabilities"
        :map="map"
        :camera="camera"
        @update:camera="onViewstateChange($event)"
      />
      <MapControlNavigation
        :modelValue="camera"
        :initialCamera="centerCamera"
        @update:modelValue="onViewstateChange($event)"
      />
      <MapControlBaseMap :modelValue="basemap" @update:modelValue="setBasemap" />
    </template>
    <template #control-right="{ popup }">
      <EntitySelector v-model="layers" :summary="summary" :dataset="modelValue" />
      <template v-if="popup.rightSidePopups.length">
        <RightSidePopup
          v-for="(p, i) in popup.rightSidePopups"
          :modelValue="p"
          :key="i"
          @toggle="popup.toggleLocation(p)"
          @close="popup.remove(p)"
        />
      </template>
    </template>
  </MapVis>
</template>

<script setup lang="ts">
import { useMoviciSettings } from "@movici-flow-lib/baseComposables/useMoviciSettings";
import { useReactiveSummary } from "@movici-flow-lib/composables/useReactiveSummary";
import { ensureProjection, transformBBox } from "@movici-flow-lib/crs";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import type { DeckCamera, ShortDataset } from "@movici-flow-lib/types";
import type { ComposableVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import { computed } from "@vue/reactivity";
import { ref, watch, type Ref } from "vue";
import MapVis from "./MapVis.vue";
import EntitySelector from "./mapControls/EntitySelector.vue";
import MapControlBaseMap from "./mapControls/MapControlBaseMap.vue";
import MapControlNavigation from "./mapControls/MapControlNavigation.vue";
import MapControlSearchBar from "./mapControls/MapControlSearchBar.vue";
import MapEntityPopup from "./mapControls/MapEntityPopup.vue";
import RightSidePopup from "./mapControls/RightSidePopup.vue";

const DEFAULT_VIEWSTATE = useMoviciSettings().settings.defaultViewState;
const props = defineProps<{
  modelValue: ShortDataset;
}>();

const { summary, currentDataset } = useReactiveSummary({ datasetOnly: true });
const store = useFlowStore();
const layers = ref([]) as Ref<ComposableVisualizerInfo[]>;
const camera = ref<DeckCamera>({ viewState: DEFAULT_VIEWSTATE });
const centerCamera = ref<DeckCamera>();

const hasGeocodeCapabilities = computed(() => store.hasCapability("geocode"));

watch(
  () => props.modelValue,
  (dataset) => {
    currentDataset.value = dataset;
  },
  { immediate: true }
);

watch(summary, async (summary) => {
  if (summary?.bounding_box) {
    await ensureProjection(summary.epsg_code);
    const newCamera = {
      bbox: {
        coords: transformBBox(summary.bounding_box, summary.epsg_code),
        fillRatio: 1 / 3,
      },
    };
    camera.value = newCamera;
    centerCamera.value = newCamera;
  }
});
</script>

<style scoped lang="scss"></style>
