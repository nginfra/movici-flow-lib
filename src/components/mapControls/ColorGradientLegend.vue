<template>
  <div class="gradient-container is-size-7" v-if="modelValue.colorType === 'gradient'">
    <label class="label is-size-7 mb-1">
      {{ $t("flow.visualization.colorConfig.color") }}
    </label>
    <div class="gradient" :style="gradientColorStyle(modelValue)"></div>
    <span class="is-flex is-justify-content-space-between">
      <span class="legend-value" v-for="(label, idx) in gradientColorLabel(modelValue)" :key="idx">
        {{ label }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { ColorLegendItem } from "@movici-flow-common/types";
import { colorTripleToHex } from "@movici-flow-common/visualizers/maps/colorMaps";

defineProps<{
  modelValue: ColorLegendItem;
}>();

function gradientColorStyle(item: ColorLegendItem): string {
  const colors = item.colorLegends.map((cl) => cl[1]),
    gradientString = [...colors.map((color) => colorTripleToHex(color))].join();
  return "background: linear-gradient(90deg, " + gradientString + ")";
}

function gradientColorLabel(item: ColorLegendItem): string[] {
  return item.colorLegends.map((cl) => cl[0]);
}
</script>

<style scoped lang="scss">
.gradient-container {
  .gradient {
    border-radius: 4px;
    width: 100%;
    height: 8px;
    background-color: $black;
  }
}
</style>
