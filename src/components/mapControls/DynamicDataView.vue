<template>
  <div class="popup" tabindex="0" :class="computedClass" :style="containerStyle">
    <div class="popup-tip" v-if="!!modelValue && tip"></div>
    <div class="data-viewer box p-0" ref="content" v-show="!!modelValue">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PickInfo } from "@deck.gl/core/lib/deck";
import type { DeckEntityObject, ViewState } from "@movici-flow-lib/types";
import {
  getClickPosition,
  getContainerStyle,
  getDynamicPosition,
  getNearestPointOnLine,
  getPointCenter,
  type ANCHOR_TYPE,
} from "@movici-flow-lib/utils/canvasPositioning";
import { computed } from "@vue/reactivity";
import inRange from "lodash/inRange";
import type mapboxgl from "mapbox-gl";
import { ref, watch, type CSSProperties } from "vue";

const DISPLAY_NONE = { display: "none" };

const props = withDefaults(
  defineProps<{
    modelValue?: PickInfo<unknown>;
    map: mapboxgl.Map;
    viewState?: ViewState;
    tip?: boolean;
    startAnchorType?: ANCHOR_TYPE;
    borderPadding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  }>(),
  {
    startAnchorType: "bottom",
  }
);

const anchorType = ref<ANCHOR_TYPE>();
const containerStyle = ref<CSSProperties>({});
const content = ref<HTMLElement | null>(null);

const computedClass = computed(() => (anchorType.value ? `popup-anchor-${anchorType.value}` : ""));
function getCoordinatesFunction(layerType = "") {
  switch (layerType) {
    case "ScatterplotLayer":
      return getPointCenter;
    case "PathLayer":
      return getNearestPointOnLine;
    case "ShapeIconLayer":
    case "PolygonLayer":
    default:
      return getClickPosition;
  }
}

function recalculatePosition(
  x: number,
  y: number,
  contentSize: { width: number; height: number },
  canvasSize: { width: number; height: number },
  padding = 5
) {
  // makes sure element is inside the map area
  if (inRange(x, 0, canvasSize.width) && inRange(y, 0, canvasSize.height)) {
    anchorType.value = getDynamicPosition({
      x,
      y,
      padding,
      anchorType: props.startAnchorType,
      width: canvasSize.width,
      height: canvasSize.height,
      selfWidth: contentSize.width,
      selfHeight: contentSize.height,
      borderPadding: props.borderPadding,
    });

    containerStyle.value = getContainerStyle({
      x,
      y,
      padding,
      width: canvasSize.width,
      height: canvasSize.height,
      selfWidth: contentSize.width,
      selfHeight: contentSize.height,
      anchorType: anchorType.value,
    });
  } else {
    containerStyle.value = DISPLAY_NONE;
  }
}

watch(
  () => [props.viewState, props.borderPadding, props.modelValue, props.map],
  () => {
    if (props.map && props.modelValue?.layer) {
      const coords = getCoordinatesFunction(props.modelValue.layer.constructor.name)(
          props.modelValue as PickInfo<DeckEntityObject<unknown>>
        ),
        contentSize = {
          width: content.value?.clientWidth ?? 220,
          height: content.value?.clientHeight ?? 130,
        },
        canvasSize = {
          width: props.map.getCanvas().clientWidth ?? 1920,
          height: props.map.getCanvas().clientHeight ?? 969,
        },
        { x, y } = props.map.project(coords as [number, number]);

      recalculatePosition(x, y, contentSize, canvasSize);
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.popup {
  min-width: max-content;
  .data-viewer {
    min-width: max-content;
    padding: 0.75rem;
    color: $grey-dark !important;
    &.focused {
      color: $black !important;
    }
  }
}
</style>
