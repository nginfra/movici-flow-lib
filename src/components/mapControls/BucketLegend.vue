<template>
  <ul class="is-size-7 mb-1">
    <li class="bucket" v-for="(entry, idx) in reversedColors" :key="idx">
      <div class="is-flex pb-1 byValue">
        <label class="label is-size-7 mb-1" v-if="!isSimple && idx == 0">
          {{ $t("flow.legend." + kind) }}
        </label>
        <span class="is-flex is-align-items-center">
          <LegendThumbnail v-bind="thumbnailProps(entry)" />
          <span class="ml-2 legend-value">{{ entry[0] }}</span>
        </span>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { FlowVisualizerType, LegendItem, RGBAColor } from "@movici-flow-lib/types";
import { computed } from "vue";
import LegendThumbnail from "./LegendThumbnail.vue";

const props = defineProps<{
  modelValue: LegendItem;
  visualizerType: FlowVisualizerType;
  isSimple?: boolean;
  kind: string;
}>();

const reversedColors = computed(() => {
  return [...props.modelValue.entries].reverse();
});
function thumbnailProps(entry: [string, unknown]) {
  const rv: {
    visualizerType: FlowVisualizerType;
    icon?: string;
    color?: RGBAColor;
  } = {
    visualizerType: props.visualizerType,
  };
  if (typeof entry[1] === "string") {
    rv.icon = entry[1];
  } else if (Array.isArray(entry[1])) {
    rv.color = entry[1] as RGBAColor;
  }
  return rv;
}
</script>

<style scoped lang="scss">
.byValue {
  flex-direction: column;
  align-items: flex-start;
}
.legend-value {
  line-height: 16px;
}
</style>
