<template>
  <DynamicDataView
    v-if="map"
    :modelValue="modelValue"
    :map="map"
    :view-state="viewState"
    startAnchorType="top-left"
  >
    <div ref="focusTarget" tabindex="0" @blur="$emit('close')">
      <MovActionMenu>
        <MovActionMenuItem
          class="is-block"
          v-for="(item, i) in actions"
          :modelValue="item"
          :key="i"
          @action="emitAndClose($event)"
        />
      </MovActionMenu>
    </div>
  </DynamicDataView>
</template>

<script setup lang="ts">
import type { PickInfo } from "@deck.gl/core/lib/deck";
import type { ActionItem, DeckCamera, ViewState } from "@movici-flow-lib/types";
import type mapboxgl from "mapbox-gl";
import { computed, onMounted, ref, type Ref } from "vue";
import DynamicDataView from "./DynamicDataView.vue";

const props = withDefaults(
  defineProps<{
    modelValue: PickInfo<unknown>;
    map?: mapboxgl.Map;
    camera?: DeckCamera;
    actions?: ActionItem[];
  }>(),
  {
    actions: () => [],
  }
);

const emit = defineEmits<{
  (e: string): void;
}>();
const viewState = computed(() => props.camera?.viewState);
const focusTarget = ref(null) as Ref<HTMLElement | null>;

function emitAndClose(event: string) {
  emit(event);
  emit("close");
}

onMounted(() => focusTarget.value?.focus());
</script>
