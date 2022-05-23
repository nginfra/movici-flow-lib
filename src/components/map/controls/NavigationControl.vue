<template>
  <div class="nav" :class="{ 'is-right-nav': isRight }">
    <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
      <b-button
        class="is-border-transparent"
        title="Zoom In"
        @click="zoom++"
        icon-left="plus"
        icon-pack="fal"
      >
      </b-button>
      <b-button
        class="is-border-transparent"
        title="Zoom Out"
        @click="zoom--"
        icon-left="minus"
        icon-pack="fal"
      >
      </b-button>
      <b-button
        v-if="centerCamera"
        class="is-border-transparent"
        title="Return to center of the view"
        @click="updateViewState({ ...centerCamera, transitionDuration: 300 })"
        icon-left="crosshairs"
        icon-pack="fal"
      >
      </b-button>
      <b-button
        class="is-border-transparent mapboxgl-ctrl-compass"
        title="Reset View"
        @click="updateViewState({ bearing: 0, pitch: 0, transitionDuration: 300 })"
      >
        <span
          class="mapboxgl-ctrl-icon"
          aria-hidden="true"
          :style="{ transform: `rotate(${-bearing}deg)` }"
        ></span>
      </b-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { CameraOptions } from '@movici-flow-common/types';

const DEFAULT_MIN_ZOOM = 0;
const DEFAULT_MAX_ZOOM = 20;
@Component({ name: 'NavigationControl' })
export default class NavigationControl extends Vue {
  @Prop({ type: Boolean, default: false }) readonly isRight!: boolean;
  @Prop({ type: Object }) readonly value?: CameraOptions;
  @Prop({ type: Object }) readonly centerCamera?: CameraOptions;

  get bearing() {
    return this.value?.bearing ?? 0;
  }

  get zoom() {
    return this.value?.zoom ?? 0;
  }

  set zoom(val: number) {
    const minZoom = this.value?.minZoom ?? DEFAULT_MIN_ZOOM;
    const maxZoom = this.value?.maxZoom ?? DEFAULT_MAX_ZOOM;
    val = Math.min(Math.max(val, minZoom), maxZoom);

    this.updateViewState({ zoom: val });
  }

  updateViewState(viewState: Partial<CameraOptions>) {
    this.$emit('input', Object.assign({}, this.value, viewState));
  }
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
      border-color: $grey-light;
      color: $grey-darker;
      background-color: $white;
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
