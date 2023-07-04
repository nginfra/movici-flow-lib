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
      <slot name="map" :map="map" :view-state="camera" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { Deck as DeckGL, Layer } from "@deck.gl/core";
import type { ControllerOptions } from "@deck.gl/core/controllers/controller";
import type { DeckProps, PickInfo } from "@deck.gl/core/lib/deck";
import type { BoundingBox } from "@movici-flow-lib/crs";
import { viewport } from "@placemarkio/geo-viewport";

import { useMoviciSettings } from "@movici-flow-lib/baseComposables/useMoviciSettings";
import type {
  CursorCallback,
  DeckCamera,
  DeckEntityObject,
  DeckEvent,
  DeckEventCallback,
  DeckEventPayload,
  DeckMouseEvent,
  ViewState,
} from "@movici-flow-lib/types";
import isEqual from "lodash/isEqual";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
const DEFAULT_VIEWSTATE = useMoviciSettings().settings.defaultViewState;

function parseViewState(camera?: DeckCamera, map?: mapboxgl.Map): ViewState {
  let result: ViewState = DEFAULT_VIEWSTATE;
  if (camera?.bbox && map) {
    result = {
      ...getViewStateFromBBOX(
        camera.bbox.coords,
        getCanvasDimensions(map),
        camera.bbox?.fillRatio ?? 1
      ),
      pitch: 0,
      bearing: 0,
      transitionDuration: 300,
    };
  } else if (camera?.viewState) {
    result = camera.viewState;
  }
  return result;
}

function getViewStateFromBBOX(
  bounding_box: BoundingBox,
  dimensions: [number, number],
  ratio: number
) {
  const { center, zoom } = viewport(
      bounding_box,
      dimensions.map((side) => side * ratio) as [number, number],
      {
        allowFloat: true,
      }
    ),
    [longitude, latitude] = center;

  return { longitude, latitude, zoom };
}

function getCanvasDimensions(map: mapboxgl.Map): [number, number] {
  const dimensions = map.getCanvas();
  return [dimensions.width, dimensions.height];
}

const props = withDefaults(
  defineProps<{
    camera?: DeckCamera;
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
  (e: "update:camera", val: DeckCamera): void;
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

function updateCamera(camera: DeckCamera) {
  const viewState = parseViewState(camera, map.value);
  updateViewState(viewState);
}
function updateViewState(viewState: ViewState) {
  deck.value?.setProps({ viewState });
  map.value?.jumpTo({
    center: [viewState.longitude, viewState.latitude],
    zoom: viewState.zoom,
    bearing: viewState.bearing,
    pitch: viewState.pitch,
  });

  emit("update:camera", { viewState });
}

function resetContextPickInfo() {
  contextPickInfo.value = undefined;
}

const slotProps = computed(() => ({
  map: map.value,
  contextPickInfo: contextPickInfo.value,
  on: on,
  resetContextPickInfo,
  onViewstateChange: updateCamera,
  setCursorCallback,
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
  () => props.camera,
  (newVal, oldVal) => {
    if (isEqual(newVal, oldVal)) return;
    newVal && updateCamera(newVal);
  }
);

function initDeck(viewState: ViewState) {
  return new DeckGL({
    canvas: "deckgl-overlay",
    width: "100%",
    height: "100%",
    initialViewState: viewState,

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
  const initialViewState = props.camera?.viewState || DEFAULT_VIEWSTATE;
  map.value = initMapBox(initialViewState);
  map.value.on("load", () => {
    map.value?.resize();
    deck.value = initDeck(initialViewState);
    if (props.camera) {
      updateCamera(props.camera);
    }
    loaded.value = true;
  });
});
onBeforeUnmount(() => {
  map.value?.remove();
  deck.value?.canvas.remove();
});
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
