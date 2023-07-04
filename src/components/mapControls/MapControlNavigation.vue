<template>
  <div class="nav" :class="{ 'is-right-nav': isRight }">
    <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
      <o-button
        class="is-border-transparent"
        title="Zoom In"
        @click.stop="zoom++"
        icon-left="plus"
        icon-pack="fal"
      />
      <o-button
        class="is-border-transparent"
        title="Zoom Out"
        @click.stop="zoom--"
        icon-left="minus"
        icon-pack="fal"
      />
      <o-button
        v-if="initialCamera"
        class="is-border-transparent"
        title="Reset the camera to its initial position"
        @click.stop="resetCamera"
        icon-left="crosshairs"
        icon-pack="fal"
      />
      <o-button
        class="is-border-transparent mapboxgl-ctrl-compass"
        title="Reset north"
        @click.stop="updateViewState({ bearing: 0, pitch: 0, transitionDuration: 300 })"
      >
        <span
          class="mapboxgl-ctrl-icon"
          aria-hidden="true"
          :style="{ transform: `rotate(${-bearing}deg)`, height: '26px', width: '26px' }"
        ></span>
      </o-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeckCamera, ViewState } from "@movici-flow-lib/types";
import { computed } from "vue";

const props = defineProps<{
  modelValue?: DeckCamera;
  isRight?: boolean;
  initialCamera?: DeckCamera;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: DeckCamera): void;
}>();

const viewState = computed(() => props.modelValue?.viewState);
const bearing = computed(() => viewState.value?.bearing ?? 0);

const DEFAULT_MIN_ZOOM = 0;
const DEFAULT_MAX_ZOOM = 20;
const zoom = computed({
  get: () => props.modelValue?.viewState?.zoom ?? 0,
  set: (val) => {
    const minZoom = viewState.value?.minZoom ?? DEFAULT_MIN_ZOOM;
    const maxZoom = viewState.value?.maxZoom ?? DEFAULT_MAX_ZOOM;
    val = Math.min(Math.max(val, minZoom), maxZoom);

    updateViewState({ zoom: val });
  },
});
function resetCamera() {
  if (props.initialCamera?.bbox) {
    updateCamera(props.initialCamera);
  } else {
    updateCamera({
      viewState: { ...(props.initialCamera?.viewState as ViewState), transitionDuration: 300 },
    });
  }
}
function updateViewState(viewState: Partial<ViewState>) {
  updateCamera({
    viewState: Object.assign({}, props.modelValue?.viewState, viewState),
  });
}

function updateCamera(camera: DeckCamera) {
  emit("update:modelValue", camera);
}
</script>

<style lang="scss" scoped>
.nav {
  width: 30px;
}

.is-right-nav {
  margin-top: 38px;
}

.mapboxgl-ctrl-group {
  box-shadow: unset !important;
  background-color: transparent;
  .button {
    width: 30px;
    height: 30px;
    border: 2px $grey-lighter solid;
    background-color: $white;
    border-radius: 0 !important;
    &:hover {
      background-color: $white-ter;
      border-color: $grey-light;
    }
    &:focus {
      border-color: $primary;
      color: $grey-darker;
    }
    &:active {
      border-color: $primary;
      background-color: $primary;
      color: $white;
    }
    &:first-child {
      border-top-right-radius: 4px !important;
      border-top-left-radius: 4px !important;
    }
    &:last-child {
      border-bottom-right-radius: 4px !important;
      border-bottom-left-radius: 4px !important;
    }
  }
}
</style>
