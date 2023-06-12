<template>
  <ul class="buckets-container is-size-7">
    <li class="bucket" v-for="(colorLegend, idx) in reversedColors" :key="idx">
      <div class="is-flex pb-1" :class="isStatic ? 'static' : 'byValue'">
        <span class="is-flex is-align-items-center">
          <span
            class="color-wrap"
            :class="{
              icon: isIcon(modelValue.visualizerType),
              line: isLine(modelValue.visualizerType),
              point: isPoint(modelValue.visualizerType),
              grid: isGrid(modelValue.visualizerType),
              polygon: isPolygon(modelValue.visualizerType),
            }"
            :style="bucketColorStyle(colorLegend[1], isPolygon(modelValue.visualizerType))"
          />
          <span class="ml-2 legend-value" v-if="!isStatic">{{ colorLegend[0] }}</span>
        </span>
        <label
          class="label is-size-7 mb-1"
          :class="{ 'ml-2': isStatic }"
          v-if="!isSimple && idx == 0"
        >
          {{ $t("flow.visualization.colorConfig.color") }}
        </label>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ColorLegendItem, FlowVisualizerType, type RGBAColor } from "@movici-flow-common/types";
import { colorTripleToHex } from "@movici-flow-common/visualizers/maps/colorMaps";
import { computed } from "vue";

const props = defineProps<{
  modelValue: ColorLegendItem;
  isSimple?: boolean;
}>();
const reversedColors = computed(() => {
  const colors = [...props.modelValue.colorLegends];
  return colors.reverse();
});

const isStatic = computed(() => {
  return reversedColors.value.length === 1;
});

function bucketColorStyle(color: RGBAColor, alpha = false) {
  const hex = colorTripleToHex(color),
    hexAlpha = colorTripleToHex(color) + "CC";

  return {
    background: !alpha ? hex : hexAlpha,
    "border-color": hex,
  };
}

function isPolygon(type: FlowVisualizerType) {
  return type === FlowVisualizerType.POLYGONS;
}

function isLine(type: FlowVisualizerType) {
  return type === FlowVisualizerType.LINES;
}

function isPoint(type: FlowVisualizerType) {
  return type === FlowVisualizerType.POINTS;
}

function isIcon(type: FlowVisualizerType) {
  return type === FlowVisualizerType.ICONS;
}

function isGrid(type: FlowVisualizerType) {
  return type === FlowVisualizerType.FLOODING_GRID || type === FlowVisualizerType.GRID;
}
</script>

<style scoped lang="scss">
ul.buckets-container {
  li {
    .static {
      flex-direction: row;
      align-items: center;
    }
    .byValue {
      flex-direction: column-reverse;
      align-items: flex-start;
    }
    span {
      display: inline-block;
      line-height: 1rem;
      &.legend-value {
        line-height: 16px;
      }
      &.color-wrap {
        line-height: 16px;
        &.line {
          min-width: 1rem;
          height: 0.5rem;
          margin: 0.25rem 0;
        }
        &.point {
          min-width: 1rem;
          height: 1rem;
          border-radius: 100%;
        }
        &.polygon,
        &.grid {
          border: 2px solid;
          min-width: 1rem;
          height: 1rem;
        }
        &.icon {
          border-radius: 2px;
          width: 16px;
          height: 16px;
        }
      }
    }
  }
}
</style>
