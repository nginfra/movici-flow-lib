<template>
  <div v-if="hasStaticItems">
    <LegendThumbnail
      class="mr-2 is-align-items-center"
      v-for="props in thumbnails"
      v-bind="props"
      :visualizerType="visualizerType"
    />
  </div>
</template>

<script setup lang="ts">
import { FlowVisualizerType, VisualizerLegend, type RGBAColor } from "@movici-flow-lib/types";
import { computed } from "vue";
import LegendThumbnail from "./LegendThumbnail.vue";
import isEmpty from "lodash/isEmpty";
const props = defineProps<{
  modelValue: VisualizerLegend;
}>();

interface ThumbnailProps {
  icon?: string;
  color?: RGBAColor;
}
const items = computed(() => props.modelValue.staticLegendItems());
const hasStaticItems = computed(() => !isEmpty(items.value));
const visualizerType = computed(() => props.modelValue.visualizerType);
const thumbnails = computed<ThumbnailProps[]>(() => {
  const color = items.value.color?.color;
  const rv: ThumbnailProps[] = [];

  if (visualizerType.value === FlowVisualizerType.ICONS) {
    let hasShape = false;

    if (items.value.shape) {
      hasShape = true;
      rv.push({
        icon: items.value.shape.icon,
        color,
      });
    }
    if (items.value.icon) {
      rv.push({
        icon: items.value.icon.icon,
        color: hasShape ? undefined : color,
      });
    }
  }

  if (rv.length === 0) {
    rv.push({ color });
  }
  return rv;
});
</script>

<style scoped lang="scss"></style>
