<template>
  <DynamicDataView
    :modelValue="modelValue.content.pickInfo"
    :map="map"
    :view-state="viewState"
    :borderPadding="popupBorderPadding"
    tip
  >
    <DataViewContent
      class="p-3"
      :modelValue="modelValue.content"
      :timestamp="timestamp"
      @togglePosition="$emit('toggle')"
      @close="$emit('close')"
      :closable="modelValue.kind === 'map-persistent'"
      dynamic
    />
  </DynamicDataView>
</template>

<script setup lang="ts">
import { useUIStore } from "@movici-flow-lib/stores/ui";
import type { DeckCamera, PopupInfo, ViewState } from "@movici-flow-lib/types";
import type mapboxgl from "mapbox-gl";
import { computed } from "vue";
import DataViewContent from "./DataViewContent.vue";
import DynamicDataView from "./DynamicDataView.vue";

const props = defineProps<{
  modelValue: PopupInfo;
  map: mapboxgl.Map;
  camera?: DeckCamera;
  timestamp?: number;
}>();

const uiStore = useUIStore();
const viewState = computed(() => props.camera?.viewState);
const popupBorderPadding = computed(() => {
  return {
    left: uiStore.collapse ? 0 : 300,
  };
});
</script>

<style lang="scss" scoped>
:deep(.data-content) {
  .attributes,
  .label {
    color: $black !important;
  }
}
</style>
