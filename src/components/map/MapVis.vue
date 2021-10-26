<template>
  <div>
    <Deck :value="viewState" @input="updateViewState($event)" :layers="layers" :basemap="basemap">
      <template v-if="buildings" #map="{ map }">
        <Buildings :map="map" />
      </template>
      <template #control-zero="{ map, onViewstateChange }">
        <slot name="control-zero" v-bind="{ ...slotProps, map, onViewstateChange }" />
      </template>
      <template #control-left="{ map, onViewstateChange }">
        <slot name="control-left" v-bind="{ ...slotProps, map, onViewstateChange }" />
      </template>
      <template #control-right="{ map, onViewstateChange }">
        <slot name="control-right" v-bind="{ ...slotProps, map, onViewstateChange }" />
      </template>
      <template #control-bottom="{ map, onViewstateChange }">
        <slot name="control-bottom" v-bind="{ ...slotProps, map, onViewstateChange }" />
      </template>
    </Deck>
  </div>
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

import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { CameraOptions, PopupContent, TimeOrientedSimulationInfo } from '@/flow/types';
import Deck from './Deck.vue';
import Buildings from './mapLayers/Buildings.vue';
import defaults from './defaults';
import { Layer } from '@deck.gl/core';
import VisualizerManager from '@/flow/visualizers/VisualizerManager';
import { Visualizer } from '@/flow/visualizers';
import { AnyVisualizerInfo } from '@/flow/visualizers/VisualizerInfo';
import { flowStore, flowUIStore } from '@/flow/store/store-accessor';
import Backend from '@/flow/api/backend';

@Component({
  name: 'MovMapVis',
  components: { Deck, Buildings }
})
export default class MovMapVis extends Vue {
  @Prop({ type: Array, default: () => [] })
  readonly layerInfos!: AnyVisualizerInfo[];

  @Prop({ type: Object, default: null })
  readonly timelineInfo!: TimeOrientedSimulationInfo | null;

  @Prop({ type: Object, default: () => defaults.viewState() })
  readonly viewState!: CameraOptions;

  @Prop({ type: Number, default: 0 })
  readonly timestamp!: number;

  @Prop({ type: Boolean, default: false })
  readonly buildings!: boolean;

  basemap = 'mapbox://styles/mapbox/light-v10';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layers: Layer<any>[] = [];
  visualizers: VisualizerManager | null = null;

  popupContent: PopupContent | null = null;
  activePopupId: string | null = null;

  setBasemap(basemap: string) {
    this.basemap = basemap;
  }

  // Move this inside a store?
  get backend(): Backend | null {
    return flowStore.backend;
  }

  ensureVisualizers() {
    if (!this.visualizers && this.backend) {
      this.visualizers = new VisualizerManager({
        backend: this.backend,
        onSuccess: () => {
          flowUIStore.setLoading({ value: false });
          this.updateLayers();
        },
        onError: () => {
          flowUIStore.setLoading({ value: false });
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
    flowUIStore.setLoading({ value: true, msg: 'Loading layers...' });
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

    this.layers = (visualizers?.getVisualizers() ?? [])
      .sort((a, b) => (a.priority === b.priority ? a.order - b.order : a.priority - b.priority))
      .map((v, idx) => {
        // typescript for some reason can't figure out the type of `v` so we make sure to cast it to the
        // type that it should be (Visualizer)
        const visualizer: Visualizer = v;

        visualizer.setCallbacks({
          onClick: (content: PopupContent | null) => {
            this.setPopup({ id: visualizer.info.id, content });
          },
          onHover: (content: PopupContent | null) => {
            this.setPopup({ id: visualizer.info.id, content });
          }
        });
        v.setLayerOrder(idx);
        return v.getLayer(this.timestamp);
      });
  }

  setPopup({ id, content }: { id: string; content: PopupContent | null }) {
    this.activePopupId = id;
    this.popupContent = content;
  }

  updateViewState(viewState: CameraOptions) {
    this.$emit('update:view-state', viewState);
  }
}
</script>

<style scoped lang="scss">
.timeslider {
  flex-grow: 1;
  margin: 0 80px;
}
</style>
