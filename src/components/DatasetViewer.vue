<template>
  <MapVis ref="mapVis" :visualizer-infos="layers" v-model:view-state="viewState" scale>
    <template #control-zero="{ map, popup }">
      <template v-if="popup.mapPopups.length && map">
        <MapEntityPopup
          v-for="(p, i) in popup.mapPopups"
          :modelValue="p"
          :key="i"
          :map="map"
          :view-state="viewState"
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
        :view-state="viewState"
        @update:view-state="onViewstateChange($event)"
      />
      <MapControlNavigation
        :modelValue="viewState"
        :centerCamera="centerCamera"
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
import type { BoundingBox } from "@movici-flow-lib/crs";
import { useMoviciSettings } from "@movici-flow-lib/baseComposables/useMoviciSettings";
import { useReactiveSummary } from "@movici-flow-lib/composables/useReactiveSummary";
import { ensureProjection, transformBBox } from "@movici-flow-lib/crs";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import type { ShortDataset, ViewState } from "@movici-flow-lib/types";
import type { ComposableVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import { computed } from "vue";
import { ref, watch, type Ref } from "vue";
import EntitySelector from "./mapControls/EntitySelector.vue";
import MapVis from "./MapVis.vue";
import MapControlBaseMap from "./mapControls/MapControlBaseMap.vue";
import MapControlNavigation from "./mapControls/MapControlNavigation.vue";
import MapControlSearchBar from "./mapControls/MapControlSearchBar.vue";
import MapEntityPopup from "./mapControls/MapEntityPopup.vue";
import RightSidePopup from "./mapControls/RightSidePopup.vue";

const DEFAULT_VIEWSTATE = useMoviciSettings().settings.defaultViewState;
const props = defineProps<{
  modelValue: ShortDataset;
}>();

const { summary, currentDataset } = useReactiveSummary();
const mapVis = ref<{ zoomToBBox(bbox: BoundingBox, ratio?: number): void } | null>(null);
const store = useFlowStore();
const layers = ref([]) as Ref<ComposableVisualizerInfo[]>;
const viewState = ref<ViewState>(DEFAULT_VIEWSTATE);
const centerCamera = ref<ViewState>();

const hasGeocodeCapabilities = computed(() => store.hasCapability("geocode"));

watch(
  () => props.modelValue,
  (dataset) => {
    currentDataset.value = dataset;
  },
  { immediate: true }
);

watch(summary, (summary) => {
  if (summary?.bounding_box) {
    const bounding_box = summary.bounding_box;
    ensureProjection(summary.epsg_code).then(() => {
      mapVis.value?.zoomToBBox(transformBBox(bounding_box, summary.epsg_code));
      centerCamera.value = viewState.value;
    });
  }
});
</script>

<style scoped lang="scss"></style>
