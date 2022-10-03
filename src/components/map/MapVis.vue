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
      <Scale v-if="scale" :map="map" />
    </template>
    <template #control-zero="deckProps">
      <DeckErrorHandling :on="deckProps.on" :layerInfos="layerInfos" />
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
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Backend, CameraOptions, DeckMouseEvent, PopupContent } from '@movici-flow-common/types';
import Deck from './Deck.vue';
import Buildings from './mapLayers/Buildings.vue';
import Scale from './controls/Scale.vue';
import DeckErrorHandling from './DeckErrorHandling';
import defaults from './defaults';
import VisualizerManager from '@movici-flow-common/visualizers/VisualizerManager';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { flowStore, flowUIStore } from '@movici-flow-common/store/store-accessor';
import DeckContainerMixin from './DeckContainerMixin';
import { BoundingBox } from '@mapbox/geo-viewport';
import { Layer } from '@deck.gl/core';
import { PopupManager } from '../map_widgets/PopupManager';
import { TapefileStoreCollection } from '@movici-flow-common/visualizers/TapefileStore';
import { getVisualizer, Visualizer } from '@movici-flow-common/visualizers';
import { DatasetDownloader } from '@movici-flow-common/utils/DatasetDownloader';

@Component({
  name: 'MovMapVis',
  components: { Deck, Buildings, Scale, DeckErrorHandling }
})
export default class MovMapVis<D = unknown> extends DeckContainerMixin<D> {
  @Prop({ type: Array, default: () => [] }) readonly layerInfos!: ComposableVisualizerInfo[];
  @Prop({ type: Object, default: () => defaults.viewState() }) readonly viewState!: CameraOptions;
  @Prop({ type: Number, default: 0 }) readonly timestamp!: number;
  @Prop({ type: Boolean, default: false }) readonly buildings!: boolean;
  @Prop({ type: Boolean, default: false }) readonly scale!: boolean;
  tapefileStores: TapefileStoreCollection = new TapefileStoreCollection();
  visualizers: VisualizerManager<ComposableVisualizerInfo, Visualizer> | null = null;
  isLoading = false;
  maxTimeAvailable: number | null = null;

  get backend(): Backend | null {
    return flowStore.backend;
  }

  get slotProps() {
    return {
      basemap: this.basemap,
      popup: this.popup,
      tapefileStores: this.tapefileStores,
      visualizers: this.visualizers,
      setBasemap: this.setBasemap,
      updateTimestamp: (t: number) => this.$emit('update:timestamp', t),
      maxTimeAvailable: this.maxTimeAvailable
    };
  }

  ensureVisualizers() {
    if (!this.visualizers && this.backend) {
      this.visualizers = new VisualizerManager<ComposableVisualizerInfo, Visualizer>({
        backend: this.backend,
        tapefileStores: this.tapefileStores,
        visualizerFactory: createComposableVisualizer,
        onSuccess: () => {
          this.isLoading = false;
          this.updateLayers();
        },
        onError: () => {
          this.isLoading = false;
        },
        onDelete: ({ info }) => {
          if (info?.id) {
            this.popup?.removeByLayer(info.id);
          }
        },
        onData: ({ timestamp }) => {
          if (timestamp !== undefined) {
            this.maxTimeAvailable = timestamp;
            this.updateLayers();
          }
        }
      });
    }

    return this.visualizers;
  }

  @Watch('layerInfos', { immediate: true })
  handleLayerInfos() {
    this.isLoading = true;
    const visualizers = this.ensureVisualizers();
    if (visualizers) {
      visualizers
        .updateVisualizers(
          this.layerInfos
            .filter(info => !Object.keys(info.errors).length)
            .map(info => {
              if (info.datasetUUID) {
                info.summary ??= flowStore.cachedSummaries[info.datasetUUID];
              }
              return info;
            })
        )
        .then(() => {});
    }
  }

  @Watch('timestamp')
  onTimestampChange() {
    this.updateLayers();
  }

  updateLayers() {
    if (flowUIStore.loading) {
      return;
    }

    const layers = (this.visualizers?.getVisualizers() ?? [])
      .reverse() // Reverse the array so that layers are rendered correctly on top of each other
      .map(v => {
        this.popup?.updatePopupVisibilityByLayer({ layerId: v.info.id, visible: v.info.visible });

        v.setCallbacks({
          onClick: (content: PopupContent | null, ev?: DeckMouseEvent) => {
            if (ev?.leftButton && content) {
              this.popup?.onClick(content, v.info.id);
            }
          },
          onHover: (content: PopupContent | null) => {
            this.popup?.onHover(content, v.info.id);
          }
        });

        return v.getLayer(this.timestamp);
      })
      .filter(l => l !== null) as unknown as Layer<D>[];

    this.setLayers(layers);
  }

  updateViewState(viewState: CameraOptions) {
    this.$emit('update:view-state', viewState);
  }

  zoomToBBox(bounding_box: BoundingBox, ratio?: number) {
    this.deckEl.zoomToBBox(bounding_box, ratio);
  }

  created() {
    this.popup = new PopupManager();
    this.handleLayerInfos();
  }
}

function createComposableVisualizer(
  layerInfo: ComposableVisualizerInfo,
  manager: VisualizerManager<ComposableVisualizerInfo, Visualizer>
): Visualizer {
  if (!layerInfo.datasetUUID) {
    throw new Error(`Invalid dataset ${layerInfo.datasetName} for layer ${layerInfo.id}: no UUID`);
  }
  const datasetStore = new DatasetDownloader({
    backend: manager.backend,
    datasetUUID: layerInfo.datasetUUID,
    scenarioUUID: layerInfo.scenarioUUID || undefined
  });
  const scenarioUUID = layerInfo.scenarioUUID ?? '';
  return getVisualizer({
    datasetStore,
    tapefileStore: manager.tapefileStores.ensure(scenarioUUID),
    info: layerInfo
  });
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
