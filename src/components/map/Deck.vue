<template>
  <div id="mapbox-container">
    <div id="map" />
    <canvas id="deckgl-overlay" />
    <div class="map-control-zero" v-if="loaded && hasMapControl('control-zero')">
      <slot name="control-zero" v-bind="{ ...slotProps }" />
    </div>
    <div class="map-control-left" v-if="loaded && hasMapControl('control-left')">
      <slot name="control-left" v-bind="{ ...slotProps }" />
    </div>
    <div class="map-control-right" v-if="loaded && hasMapControl('control-right')">
      <slot name="control-right" v-bind="{ ...slotProps }" />
    </div>
    <div class="map-control-bottom" v-if="loaded && hasMapControl('control-bottom')">
      <slot name="control-bottom" v-bind="{ ...slotProps }" />
    </div>
    <template v-if="loaded">
      <slot name="map" :map="map" :deck="deck" :view-state="value" />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Deck as DeckGL, Layer } from '@deck.gl/core';
import { DeckProps, PickInfo } from '@deck.gl/core/lib/deck';
import { CameraOptions, CursorCallback, DeckMouseEvent, Nullable } from '@movici-flow-common/types';
import { ControllerOptions } from '@deck.gl/core/controllers/controller';
import defaults from './defaults';
import { viewport, BoundingBox } from '@mapbox/geo-viewport';
import { failMessage } from '@movici-flow-common/utils/snackbar';

const DEFAULT_VIEWSTATE = defaults.viewState();

function getViewportFromBBOX(
  bounding_box: BoundingBox,
  dimensions: [number, number],
  ratio: number
) {
  const { center, zoom } = viewport(
      bounding_box,
      // we set the ratio 1/3 as we want the viewport to occupy 1/3 of the map screen
      dimensions.map(side => side * ratio) as [number, number],
      undefined, // min zoom, default 0
      undefined, // max zoom, default 20
      undefined, // tileSize, default 256
      true // use float on zoom
    ),
    [longitude, latitude] = center;

  return { longitude, latitude, zoom };
}

function getCanvasDimensions(map: mapboxgl.Map): [number, number] {
  const dimensions = map.getCanvas();
  return [dimensions.width, dimensions.height];
}

type DeckSlots = 'control-zero' | 'control-left' | 'control-right' | 'control-bottom';

type eventCallback = (event: PickInfo<unknown>, ev?: DeckMouseEvent) => void;

@Component({ name: 'Deck' })
export default class Deck extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: Nullable<CameraOptions>;
  @Prop({ type: String, default: 'mapbox://styles/mapbox/light-v10' }) readonly basemap!: string;
  @Prop({ type: String, default: process.env.VUE_APP_MAPBOX_TOKEN }) readonly accessToken!: string;
  @Prop({ type: Object }) readonly controller!: ControllerOptions;
  @Prop({ type: Array, default: () => [] }) readonly layers!: Layer<unknown>[];
  map: mapboxgl.Map | null = null;
  deck: DeckGL | null = null;
  eventListeners: Record<string, Map<string, eventCallback>> = {
    click: new Map<string, eventCallback>(),
    'drag-start': new Map<string, eventCallback>()
  };
  loaded = false;
  getCursor: CursorCallback | null = null;

  get slotProps() {
    return {
      map: this.map,
      on: this.on,
      onViewstateChange: this.updateViewState,
      setCursorCallback: this.setCursorCallback,
      zoomToBBox: this.zoomToBBox
    };
  }

  get dragStartListeners() {
    return this.eventListeners['drag-start'];
  }

  get clickListeners() {
    return this.eventListeners.click;
  }

  /**
   * If there are children elements inside the scopedSlots this returns true.
   *
   * @param control one of the allowed scopedSlots (DeckSlots)
   * @returns boolean
   */
  hasMapControl(control: DeckSlots) {
    return !!this.$scopedSlots[control]?.({});
  }

  on(event: string, callbacks: Record<string, eventCallback>) {
    Object.entries(callbacks).forEach(([key, callback]) => {
      this.eventListeners[event].set(key, callback);
    });
  }

  setCursorCallback(cb: CursorCallback) {
    this.getCursor = cb || (() => null);
  }

  zoomToBBox(bounding_box: BoundingBox, ratio = 1 / 3) {
    try {
      if (this.map) {
        this.updateViewState({
          ...this.value,
          ...getViewportFromBBOX(bounding_box, getCanvasDimensions(this.map), ratio),
          transitionDuration: 300
        } as CameraOptions);
      }
    } catch (error) {
      failMessage('Error when centering to BBOX');
      console.error(error);
    }
  }

  @Watch('basemap')
  setStyle() {
    this.map?.setStyle(this.basemap);
  }

  @Watch('layers')
  renderDeck() {
    this.deck?.setProps({ layers: this.layers });
  }

  @Watch('value')
  onValue(val: CameraOptions) {
    this.updateViewState(val);
  }

  updateViewState(viewState: CameraOptions) {
    this.deck?.setProps({ viewState });
    this.map?.jumpTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      bearing: viewState.bearing,
      pitch: viewState.pitch
    });

    this.$emit('input', viewState);
  }

  initDeck(val: CameraOptions) {
    return new DeckGL({
      canvas: 'deckgl-overlay',
      width: '100%',
      height: '100%',
      initialViewState: val,
      onClick: (info: PickInfo<unknown>, ev?: DeckMouseEvent) => {
        if (ev?.leftButton) {
          this.clickListeners.forEach(cb => cb(info, ev));
        }
      },
      onDragStart: (info: PickInfo<unknown>, ev?: DeckMouseEvent) => {
        this.dragStartListeners.forEach(cb => cb(info, ev));
      },
      // @ts-expect-error
      getCursor: ({ isHovering, isDragging }) => {
        const cursorOverride = this.getCursor?.({ isHovering, isDragging });
        if (cursorOverride) return cursorOverride;
        if (isHovering) return 'pointer';
        if (isDragging) return 'grabbing';
        return 'grab';
      },
      controller: this.controller ?? true,
      layers: [],
      onViewStateChange: ({ viewState }: { viewState: CameraOptions }) => {
        this.updateViewState(viewState);
      }
    } as unknown as DeckProps);
  }

  initMapBox(viewState: CameraOptions) {
    return new mapboxgl.Map({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      bearing: viewState.bearing,
      pitch: viewState.pitch,
      container: 'map',
      accessToken: this.accessToken,
      maxPitch: 65,
      style: this.basemap,
      attributionControl: false,
      interactive: false
    });
  }

  mounted() {
    this.map = this.initMapBox(this.value || DEFAULT_VIEWSTATE);
    this.map.on('load', () => {
      this.map?.resize();
      this.deck = this.initDeck(this.value || DEFAULT_VIEWSTATE);
      this.loaded = true;
    });
  }

  beforeDestroy() {
    // this was triggering errors
    // need to destroy children, so that layer removal is done before the map itself is removed
    this.$children.forEach(child => child.$destroy());
    this.map?.remove();
    this.deck?.canvas.remove();
  }
}
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

  ::v-deep {
    .map-control-left {
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

    .map-control-right {
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

    .map-control-bottom {
      $left-menu-size: 300px;
      position: fixed;
      bottom: 24px;
      height: 100px;
      z-index: 1;
      left: 0;
      right: 0;
      width: calc(80vw - #{$left-menu-size} - #{$menu-item-size});
      display: flex;
      justify-content: center;
      transition: transform 0.5s, width 0.5s;
    }
  }

  .deck-tooltip {
    width: 30px;
    height: 20px;
  }

  ::v-deep {
    .mapboxgl-ctrl-bottom-left {
      right: 10px;
      left: unset;
    }
    .mapboxgl-popup {
      z-index: 99;
      .mapboxgl-popup-content {
        padding: 18px 24px 12px 12px;
      }
      .mapboxgl-popup-close-button {
        font-family: 'Font Awesome 5 Pro';
        font-size: 0px;
        content: '';
        width: 24px;
        height: 24px;
        &::before {
          font-size: 12px;
          content: '\f00d';
        }
      }
    }
  }
}
</style>
