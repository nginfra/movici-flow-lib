<template>
  <div id="mapbox-container">
    <div id="map" />
    <canvas id="deckgl-overlay" :style="backgroundColorStyle" @contextmenu.prevent />
    <div class="map-control map-control-zero" v-if="loaded">
      <slot name="control-zero" v-bind="slotProps" />
    </div>
    <div class="map-control map-control-left" v-if="loaded">
      <slot name="control-left" v-bind="slotProps" />
    </div>
    <div class="map-control map-control-right" v-if="loaded">
      <slot name="control-right" v-bind="slotProps" />
    </div>
    <div class="map-control map-control-bottom" v-if="loaded">
      <slot name="control-bottom" v-bind="slotProps" />
    </div>
    <template v-if="loaded">
      <slot name="map" :map="map" :view-state="modelValue" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { Deck as DeckGL, Layer } from "@deck.gl/core";
import type { ControllerOptions } from "@deck.gl/core/controllers/controller";
import type { DeckProps, PickInfo } from "@deck.gl/core/lib/deck";
import { viewport, type BoundingBox } from "@mapbox/geo-viewport";
import { useMoviciSettings } from "@movici-flow-common/baseComposables/useMoviciSettings";
import { useSnackbar } from "@movici-flow-common/baseComposables/useSnackbar";
import type {
  CursorCallback,
  DeckEntityObject,
  DeckEvent,
  DeckEventCallback,
  DeckEventPayload,
  DeckMouseEvent,
  ViewState,
} from "@movici-flow-common/types";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const DEFAULT_VIEWSTATE = useMoviciSettings().settings.defaultViewState;

function getViewportFromBBOX(
  bounding_box: BoundingBox,
  dimensions: [number, number],
  ratio: number
) {
  const { center, zoom } = viewport(
      bounding_box,
      // we set the ratio 1/3 as we want the viewport to occupy 1/3 of the map screen
      dimensions.map((side) => side * ratio) as [number, number],
      undefined, // min zoom, default 0
      undefined, // max zoom, default 20
      undefined, // tileSize, default 256
      true // allow float for zoom
    ),
    [longitude, latitude] = center;

  return { longitude, latitude, zoom };
}

function getCanvasDimensions(map: mapboxgl.Map): [number, number] {
  const dimensions = map.getCanvas();
  return [dimensions.width, dimensions.height];
}

// type DeckSlots = "control-zero" | "control-left" | "control-right" | "control-bottom";

const { failMessage } = useSnackbar();

const props = withDefaults(
  defineProps<{
    modelValue?: ViewState;
    basemap?: string;
    accessToken?: string;
    controller?: ControllerOptions;
    layers?: Layer<unknown>[];
  }>(),
  {
    basemap: "mapbox://styles/mapbox/light-v10",
    accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
    layers: () => [],
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: ViewState): void;
}>();
const map = ref<mapboxgl.Map>();
const deck = ref<DeckGL>();
const eventListeners = ref<Record<DeckEvent, Map<string, DeckEventCallback>>>({
  click: new Map<string, DeckEventCallback>(),

  error: new Map<string, DeckEventCallback>(),
});

const loaded = ref(false);
const contextPickInfo = ref<PickInfo<DeckEntityObject<unknown>>>();
const getCursor = ref<CursorCallback>();

const showMap = computed(() => props.basemap.startsWith("mapbox://"));
const backgroundColorStyle = computed(() =>
  props.basemap.startsWith("color://") ? { "background-color": props.basemap.split("//")[1] } : {}
);

function on(event: DeckEvent, callbacks: Record<string, DeckEventCallback>) {
  Object.entries(callbacks).forEach(([key, callback]) => {
    eventListeners.value[event].set(key, callback);
  });
}

function invokeCallbacks(event: DeckEvent, payload: DeckEventPayload) {
  for (const cb of eventListeners.value[event].values() ?? []) {
    cb(payload);
  }
}

function setCursorCallback(cb?: CursorCallback) {
  getCursor.value = cb || (() => null);
}

function zoomToBBox(bounding_box: BoundingBox, ratio = 1 / 3) {
  try {
    if (map.value) {
      const viewstate = {
        ...props.modelValue,
        ...getViewportFromBBOX(bounding_box, getCanvasDimensions(map.value), ratio),
        transitionDuration: 300,
      };

      updateViewState(viewstate as ViewState);
    }
  } catch (error) {
    failMessage("Error when centering to BBOX");
    console.error(error);
  }
}

function updateViewState(viewState: ViewState) {
  deck.value?.setProps({ viewState });
  map.value?.jumpTo({
    center: [viewState.longitude, viewState.latitude],
    zoom: viewState.zoom,
    bearing: viewState.bearing,
    pitch: viewState.pitch,
  });

  emit("update:modelValue", viewState);
}

function resetContextPickInfo() {
  contextPickInfo.value = undefined;
}

const slotProps = computed(() => ({
  map: map.value,
  contextPickInfo: contextPickInfo.value,
  on: on,
  resetContextPickInfo,
  onViewstateChange: updateViewState,
  setCursorCallback,
  zoomToBBox,
}));

watch(
  () => props.basemap,
  (basemap) => {
    map.value?.setStyle(showMap.value ? basemap : (null as unknown as string));
  }
);
watch(
  () => props.layers,
  (layers) => {
    deck.value?.setProps({ layers });
  }
);

watch(
  () => props.modelValue,
  (val) => {
    val && updateViewState(val);
  }
);

function initDeck(val: ViewState) {
  return new DeckGL({
    canvas: "deckgl-overlay",
    width: "100%",
    height: "100%",
    initialViewState: val,

    onClick: (info: PickInfo<DeckEntityObject<unknown>>, ev?: DeckMouseEvent) => {
      resetContextPickInfo();
      const payload = { pickInfo: info, ev, layer: info.layer as Layer<unknown> };
      if (ev?.leftButton) {
        invokeCallbacks("click", payload);
      } else if (ev?.rightButton) {
        contextPickInfo.value = info;
      }
      invokeCallbacks("click", payload);
    },
    onError: (error: Error, layer?: Layer<unknown>) => {
      console.error(error);
      invokeCallbacks("error", { error, layer });
    },
    getCursor: ({ isHovering, isDragging }: { isHovering: boolean; isDragging: boolean }) => {
      const cursorOverride = getCursor.value?.({ isHovering, isDragging });
      if (cursorOverride) return cursorOverride;
      if (isHovering) return "pointer";
      if (isDragging) return "grabbing";
      return "grab";
    },
    controller: props.controller ?? true,
    layers: [],
    onViewStateChange: ({ viewState }: { viewState: ViewState }) => {
      updateViewState(viewState);
    },
  } as unknown as DeckProps);
}

function initMapBox(viewState: ViewState) {
  return new mapboxgl.Map({
    center: [viewState.longitude, viewState.latitude],
    zoom: viewState.zoom,
    bearing: viewState.bearing,
    pitch: viewState.pitch,
    container: "map",
    accessToken: props.accessToken,
    maxPitch: 65,
    style: props.basemap,
    attributionControl: false,
    interactive: false,
  });
}
onMounted(() => {
  map.value = initMapBox(props.modelValue || DEFAULT_VIEWSTATE);
  map.value.on("load", () => {
    map.value?.resize();
    deck.value = initDeck(props.modelValue || DEFAULT_VIEWSTATE);
    loaded.value = true;
  });
});
onBeforeUnmount(() => {
  // todo: destroy children before removing map
  // this.$children.forEach((child) => child.$destroy());
  map.value?.remove();
  deck.value?.canvas.remove();
});

defineExpose({ zoomToBBox });
</script>

<style scoped lang="scss">
#mapbox-container {
  width: 100%;
  & > #map,
  & > #deckgl-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
  }

  .map-control-zero {
    position: absolute;
    top: 0;
    left: 0;
  }

  :deep(.map-control-left) {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    flex-direction: column;
    align-content: flex-start;
    transition: transform 0.5s;
    & > * {
      margin-bottom: 8px;
      margin-right: auto;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  :deep(.map-control-right) {
    display: flex;
    flex-direction: column;
    align-content: flex-end;
    position: absolute;
    top: 10px;
    right: 10px;
    overflow: auto;
    padding: 4px 8px 24px;
    margin-right: -8px;
    margin-left: -8px;
    max-height: calc(100% - 20px - 140px);
    & > * {
      width: 100%;
      margin-bottom: 8px;
      margin-left: auto;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  :deep(.map-control-bottom) {
    $left-menu-size: 300px;
    position: fixed;
    bottom: 24px;
    z-index: 1;
    left: 0;
    right: 0;
    width: calc(80vw - #{$left-menu-size} - #{$menu-item-size});
    display: flex;
    justify-content: center;
    transition: transform 0.5s, width 0.5s;
  }
  .deck-tooltip {
    width: 30px;
    height: 20px;
  }

  :deep(.mapboxgl-ctrl-bottom-left) {
    right: 10px;
    left: unset;
  }
  :deep(.mapboxgl-popup) {
    z-index: 99;
    .mapboxgl-popup-content {
      padding: 18px 24px 12px 12px;
    }
    .mapboxgl-popup-close-button {
      font-family: "Font Awesome 5 Pro";
      font-size: 0px;
      content: "";
      width: 24px;
      height: 24px;
      &::before {
        font-size: 12px;
        content: "\f00d";
      }
    }
  }
  .map-control:empty {
    display: none;
  }
}
</style>
