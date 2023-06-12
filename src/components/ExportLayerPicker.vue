<template>
  <div class="export-layer-picker">
    <VisualizerElement>
      <template #header>
        <label class="label is-flex-grow-1 pl-1 pr-3" @click="$emit('selectInfo', {})">
          <span class="is-block is-size-6-half text-ellipsis">Custom</span>
        </label>
      </template>
    </VisualizerElement>
    <VisualizerElement
      v-for="info in modelValue"
      :key="info.id"
      :modelValue="info"
      :headerButtons="['errors']"
      tooltipActive
    >
      <template #header="{ toggleSummary, isOpen }">
        <label class="label is-flex-grow-1 pl-1 pr-3" @click="$emit('selectInfo', info)">
          <span class="is-block is-size-6-half text-ellipsis">{{ info.name }}</span>
        </label>
        <span class="export mr-1" @click="toggleSummary">
          <o-icon size="small" pack="fas" :icon="isOpen ? 'angle-up' : 'angle-down'" />
        </span>
      </template>
    </VisualizerElement>
  </div>
</template>

<script setup lang="ts">
import type { ComposableVisualizerInfo } from "@movici-flow-common/visualizers/VisualizerInfo";
import VisualizerElement from "./VisualizerElement.vue";

defineProps<{
  modelValue?: ComposableVisualizerInfo[];
}>();
</script>

<style scoped lang="scss">
.label,
.export {
  cursor: pointer;
}
</style>
