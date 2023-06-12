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
import type { ActionItem, ViewState } from "@movici-flow-common/types";
import type mapboxgl from "mapbox-gl";
import { onMounted, ref, type Ref } from "vue";
import DynamicDataView from "./DynamicDataView.vue";

withDefaults(
  defineProps<{
    modelValue: PickInfo<unknown>;
    map?: mapboxgl.Map;
    viewState?: ViewState;
    actions?: ActionItem[];
  }>(),
  {
    actions: () => [],
  }
);

const emit = defineEmits<{
  (e: string): void;
}>();
const focusTarget = ref(null) as Ref<HTMLElement | null>;

function emitAndClose(event: string) {
  emit(event);
  emit("close");
}

onMounted(() => focusTarget.value?.focus());
</script>
