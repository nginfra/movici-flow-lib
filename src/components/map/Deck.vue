<template>
  <div>
    <div id="mapbox-container">
      <div id="map" />
      <canvas id="deckgl-overlay" />
      <div class="map-control-zero" v-if="loaded">
        <slot name="control-zero" :map="map" :on-viewstate-change="updateViewState" />
      </div>
      <div class="map-control-left" v-if="loaded">
        <slot name="control-left" :map="map" :on-viewstate-change="updateViewState" />
      </div>
      <div class="map-control-right" v-if="loaded">
        <slot name="control-right" :map="map" :on-viewstate-change="updateViewState" />
      </div>
      <div class="map-control-bottom" v-if="loaded">
        <slot name="control-bottom" :map="map" :on-viewstate-change="updateViewState" />
      </div>
      <template v-if="loaded">
        <slot name="map" :map="map" :deck="deck" :view-state="value" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Deck as DeckGL, Layer } from '@deck.gl/core';
import { DeckProps, PickInfo } from '@deck.gl/core/lib/deck';
import { hasOwnProperty } from '@/flow/utils';
import { CameraOptions, Nullable } from '@/flow/types';

const DEFAULT_VIEWSTATE = {
  latitude: 51.992381,
  longitude: 4.3649092,
  zoom: 10,
  bearing: 0,
  pitch: 0
};

@Component({
  name: 'Deck'
})
export default class Deck extends Vue {
  @Prop([Object]) readonly value!: Nullable<CameraOptions>;

  @Prop({
    type: String,
    default: 'mapbox://styles/mapbox/light-v10'
  })
  readonly basemap!: string;

  @Prop({
    type: String,
    default: process.env.VUE_APP_MAPBOX_TOKEN
  })
  readonly accessToken!: string;

  @Prop({
    type: Array,
    default() {
      return [];
    }
  })
  readonly layers!: Layer<unknown>[];
  map: mapboxgl.Map | null = null;
  deck: DeckGL | null = null;
  loaded = false;

  @Watch('basemap')
  setStyle() {
    this.map?.setStyle(this.basemap);
  }

  mounted() {
    const viewState = this.value || DEFAULT_VIEWSTATE;
    this.map = new mapboxgl.Map({
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

    this.map.on('load', () => {
      this.loaded = true;
    });

    this.deck = new DeckGL(({
      canvas: 'deckgl-overlay',
      width: '100%',
      height: '100%',
      initialViewState: viewState,
      // @ts-expect-error
      getCursor: ({ isHovering }) => {
        return isHovering ? 'pointer' : 'initial';
      },
      controller: true,
      layers: [],
      onViewStateChange: ({ viewState }: { viewState: CameraOptions }) => {
        this.updateViewState(viewState);
      },
      getTooltip(info: PickInfo<unknown>) {
        const object = info.object;
        if (object && typeof object === 'object' && hasOwnProperty(object, 'onHoverText')) {
          return `${object.onHoverText}`;
        }
      }
    } as unknown) as DeckProps);
  }

  @Watch('layers')
  renderDeck() {
    if (!this.deck) {
      throw new Error('No Deck to render');
    }
    if (!this.map) {
      throw new Error('Cannot render deck when Map is not initialized');
    }

    this.deck.setProps({ layers: this.layers });
  }

  @Watch('value')
  updateViewState(viewState: CameraOptions) {
    this.deck && this.deck.setProps({ viewState });
    this.map?.jumpTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      bearing: viewState.bearing,
      pitch: viewState.pitch
    });
    this.$emit('input', viewState);
  }

  beforeDestroy() {
    // this was triggering errors
    // need to destroy children, so that layer removal is done before the map itself is removed
    this.$children.forEach(child => child.$destroy());
    this.map?.remove();
    // this.deck?.canvas.remove();
  }
}
</script>

<style scoped lang="scss">
#mapbox-container {
  width: 100%;
  height: 100vh;

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
      position: absolute;
      top: 10px;
      right: 10px;
      & > * {
        margin-bottom: 8px;
        margin-left: auto;
        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .map-control-bottom {
      position: absolute;
      bottom: 24px;
      height: 100px;
      z-index: 1;
      left: 0;
      right: 0;
      width: calc(100vw - #{$left-menu-size} - #{$menu-item-size});
      $left-menu-size: 300px;
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
