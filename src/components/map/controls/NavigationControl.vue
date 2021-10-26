<template>
  <div class="nav" :class="{ 'is-right': isRight }">
    <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
      <button
        class="mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-in"
        type="button"
        title="Zoom In"
        @click="zoom++"
      >
        <span class="mapboxgl-ctrl-icon" aria-hidden="true"></span>
      </button>
      <button
        class="mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-out"
        type="button"
        title="Zoom Out"
        @click="zoom--"
      >
        <span class="mapboxgl-ctrl-icon" aria-hidden="true"></span>
      </button>
      <button
        class="mapboxgl-ctrl-icon mapboxgl-ctrl-compass"
        type="button"
        title="Reset View"
        @click="updateViewState({ bearing: 0, pitch: 0, transitionDuration: 200 })"
      >
        <span
          class="mapboxgl-ctrl-icon"
          aria-hidden="true"
          :style="{ transform: `rotate(${-bearing}deg)` }"
        ></span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { CameraOptions } from '@/flow/types';

const DEFAULT_MIN_ZOOM = 0;
const DEFAULT_MAX_ZOOM = 20;
@Component({
  name: 'NavigationControl'
})
export default class NavigationControl extends Vue {
  @Prop({ type: Boolean, default: false }) readonly isRight!: boolean;

  @Prop([Object])
  readonly value!: CameraOptions;

  get bearing() {
    return this.value ? this.value.bearing : 0;
  }

  get zoom() {
    return this.value ? this.value.zoom : 0;
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

.is-right {
  margin-top: 38px;
}

.mapboxgl-ctrl-group {
  box-shadow: unset !important;
  background-color: white;
  color: #363636;
  button {
    width: 30px;
    height: 30px;
    border-right: 2px #dbdbdb solid;
    border-left: 2px #dbdbdb solid;
    &:hover {
      border-color: #b5b5b5 !important;
    }
    &:first-child {
      border-radius: 4px 4px 0 0;
      border-top: 2px #dbdbdb solid;
    }
    &:last-child {
      border-radius: 0 0 4px 4px;
      border-bottom: 2px #dbdbdb solid;
    }
  }
}
</style>
