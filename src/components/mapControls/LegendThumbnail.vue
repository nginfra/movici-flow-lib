<template>
  <o-icon v-if="icon" :icon="icon" pack="fas" size="small" :style="iconStyle" />
  <span v-else class="color-thumb" :class="geometryClass" :style="computedStyle" />
</template>

<script setup lang="ts">
import { FlowVisualizerType, type RGBAColor } from "@movici-flow-lib/types";
import {
  MoviciColors,
  colorTripleToHex,
  hexToColorTriple,
} from "@movici-flow-lib/visualizers/maps/colorMaps";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    visualizerType: FlowVisualizerType;
    icon?: string;
    color?: RGBAColor;
  }>(),
  {
    color: () => hexToColorTriple(MoviciColors.LIGHT_GREY),
    icon: "",
  }
);

const geometryClass = computed(() => {
  switch (props.visualizerType) {
    case FlowVisualizerType.POINTS:
      return "point";
    case FlowVisualizerType.LINES:
      return "line";
    case FlowVisualizerType.POLYGONS:
      return "polygon";
    case FlowVisualizerType.GRID:
    case FlowVisualizerType.FLOODING_GRID:
      return "grid";
    case FlowVisualizerType.ARCS:
      return "arc";
    case FlowVisualizerType.ICONS:
      return "icon";
    default:
      return "";
  }
});

const computedStyle = computed(() => {
  const hex = colorTripleToHex(props.color),
    hexAlpha = colorTripleToHex(props.color) + "CC";

  return {
    background: geometryClass.value === "polygon" ? hexAlpha : hex,
    "border-color": hex,
    "margin-right": "2px"
  };
});
const iconStyle = computed(() => {
  return {
    color: colorTripleToHex(props.color),
    width: "18px",
  };
});
</script>

<style scoped lang="scss">
.color-thumb {
  display: inline-block;

  line-height: 16px;
  &.arc,
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
</style>
