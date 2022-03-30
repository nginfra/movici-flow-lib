<template>
  <Deck
    ref="deck"
    :value="viewState"
    @input="updateViewState($event)"
    :layers="layers"
    :basemap="basemap"
  >
    <template #map="{ map }">
      <b-loading is-full-page :active="isLoading">
        <div class="loading-icon-container">
          <b-icon class="loading-icon" />
          <span class="mt-6 is-block">Loading layers...</span>
        </div>
      </b-loading>
      <Buildings v-if="buildings" :map="map" />
    </template>
    <template #control-zero="deckProps">
      <slot name="control-zero" v-bind="{ ...slotProps, ...deckProps }" />
    </template>
    <template #control-left="deckProps">
      <slot name="control-left" v-bind="{ ...slotProps, ...deckProps }" />
    </template>
    <template #control-right="deckProps">
      <slot name="control-right" v-bind="{ ...slotProps, ...deckProps }" />
    </template>
    <template #control-bottom="deckProps">
      <slot name="control-bottom" v-bind="{ ...slotProps, ...deckProps }" />
    </template>
  </Deck>
</template>

<script lang="ts">
type SlotProps = {
  basemap: string;
  setBasemap: (basemap: string) => void;
  popupContent: PopupContent | null;
  updateTimestamp: (t: number) => void;
  dynamicPopup: boolean;
  closePopup: () => void;
};

import { Component, Prop, Watch } from 'vue-property-decorator';
import {
  Backend,
  CameraOptions,
  PopupContent,
  TimeOrientedSimulationInfo
} from '@movici-flow-common/types';
import Deck from './Deck.vue';
import Buildings from './mapLayers/Buildings.vue';
import defaults from './defaults';
import VisualizerManager from '@movici-flow-common/visualizers/VisualizerManager';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { flowStore, flowUIStore } from '@movici-flow-common/store/store-accessor';
import DeckContainerMixin from './DeckContainerMixin';
import { BoundingBox } from '@mapbox/geo-viewport';

@Component({
  name: 'MovMapVis',
  components: { Deck, Buildings }
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class MovMapVis extends DeckContainerMixin<any> {
  @Prop({ type: Array, default: () => [] }) readonly layerInfos!: ComposableVisualizerInfo[];
  @Prop({ type: Object, default: null }) readonly timelineInfo!: TimeOrientedSimulationInfo | null;
  @Prop({ type: Object, default: () => defaults.viewState() }) readonly viewState!: CameraOptions;
  @Prop({ type: Number, default: 0 }) readonly timestamp!: number;
  @Prop({ type: Boolean, default: false }) readonly buildings!: boolean;
  visualizers: VisualizerManager | null = null;
  popupContent: PopupContent | null = null;
  activePopupId: string | null = null;
  isLoading = false;

  // Move this inside a store?
  get backend(): Backend | null {
    return flowStore.backend;
  }

  ensureVisualizers() {
    if (!this.visualizers && this.backend) {
      this.visualizers = new VisualizerManager({
        backend: this.backend,
        onSuccess: () => {
          this.isLoading = false;
          this.updateLayers();
        },
        onError: () => {
          this.isLoading = false;
        },
        onDelete: ({ info }) => {
          if (info) {
            if (info.id === this.activePopupId) {
              this.activePopupId = null;
              this.popupContent = null;
            }
          }
        }
      });
    }

    return this.visualizers;
  }

  get slotProps(): SlotProps {
    return {
      basemap: this.basemap,
      setBasemap: this.setBasemap,
      popupContent: this.popupContent,
      updateTimestamp: (t: number) => this.$emit('update:timestamp', t),
      dynamicPopup: this.popupContent?.position === 'dynamic',
      closePopup: () => (this.popupContent = null)
    };
  }

  @Watch('layerInfos', { immediate: true })
  handleNewLayerInfos() {
    this.isLoading = true;
    const visualizers = this.ensureVisualizers();

    if (visualizers) {
      visualizers.updateVisualizers(this.layerInfos).then(() => {});
    }
  }

  @Watch('timestamp')
  updateLayers() {
    if (flowUIStore.loading) {
      return;
    }

    const visualizers = this.ensureVisualizers();

    // We sort the visualizers from high to low b-a sorts from high to low so that
    // the visualizers with the lower order are rendered last, and on top of other visualizers
    const layers = (visualizers?.getVisualizers() ?? [])
      .sort((a, b) => b.order - a.order)
      .map(v => {
        v.setCallbacks({
          onClick: (content: PopupContent | null) => {
            this.setPopup({ id: v.info.id, content });
          },
          onHover: (content: PopupContent | null) => {
            this.setPopup({ id: v.info.id, content });
          }
        });
        return v.getLayer(this.timestamp);
      });

    this.setLayers(layers);
  }

  setPopup({ id, content }: { id: string; content: PopupContent | null }) {
    this.activePopupId = id;
    this.popupContent = content;
  }

  updateViewState(viewState: CameraOptions) {
    this.$emit('update:view-state', viewState);
  }

  zoomToBBox(bounding_box: BoundingBox, ratio?: number) {
    this.deckEl.zoomToBBox(bounding_box, ratio);
  }
}
</script>

<style scoped lang="scss">
.timeslider {
  flex-grow: 1;
  margin: 0 80px;
}
.loading-overlay {
  z-index: 1;
  .loading-icon {
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
