<template>
  <MapVis ref="mapVis" :layer-infos="layers" :view-state.sync="viewState" scale>
    <template #control-left="{ map, onViewstateChange, basemap, setBasemap }">
      <SearchBar
        v-if="hasGeocodeCapabilities"
        :map="map"
        :view-state="viewState"
        @update:view-state="onViewstateChange($event)"
      />
      <NavigationControl
        :value="viewState"
        :center-camera="centerCamera"
        @input="onViewstateChange($event)"
      />
      <BaseMapControl :value="basemap" @input="setBasemap" />
    </template>
    <template #control-right="{ popupContent, closePopup }">
      <EntitySelector
        :summary="summary"
        :currentDataset="value"
        @setLayerInfos="setLayerInfos"
      ></EntitySelector>
      <WidgetContainer v-if="popupContent" :value="popupContent">
        <DataViewContent @close="closePopup" :value="popupContent" :timestamp="0" />
      </WidgetContainer>
    </template>
  </MapVis>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator';
import isEqual from 'lodash/isEqual';
import EntitySelector from './EntitySelector.vue';
import SearchBar from '../map/controls/SearchBar.vue';
import NavigationControl from '../map/controls/NavigationControl.vue';
import BaseMapControl from '../map/controls/BaseMapControl.vue';
import DataViewContent from '../map_widgets/DataViewContent.vue';
import WidgetContainer from '../map_widgets/WidgetContainer.vue';
import SummaryListing from '@movici-flow-common/mixins/SummaryListing';
import MapVis from '../map/MapVis.vue';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { CameraOptions, Dataset, DatasetSummary, Nullable } from '@movici-flow-common/types';
import defaults from '../map/defaults';
import { flowStore } from '@movici-flow-common/store/store-accessor';
import { transformBBox } from '@movici-flow-common/crs';

@Component({
  name: 'DatasetViewer',
  components: {
    MapVis,
    EntitySelector,
    SearchBar,
    NavigationControl,
    BaseMapControl,
    DataViewContent,
    WidgetContainer
  }
})
export default class DatasetViewer extends Mixins(SummaryListing) {
  @Prop([Object]) value!: Dataset;
  @Ref('mapVis') readonly mapVisEl!: MapVis;
  layers: ComposableVisualizerInfo[] = [];
  viewState: Nullable<CameraOptions> = defaults.viewState();
  centerCamera: Nullable<CameraOptions> | null = null;

  get hasGeocodeCapabilities() {
    return flowStore.hasGeocodeCapabilities;
  }

  setLayerInfos(layerInfos: ComposableVisualizerInfo[]) {
    if (!isEqual(this.layers, layerInfos)) {
      this.layers = layerInfos;
    }
  }

  @Watch('value', { immediate: true })
  setDatasetUUID() {
    if (this.value) {
      this.currentDatasetUUID = this.value.uuid;
    }
  }

  @Watch('summary')
  zoomToSummaryBBox(summary: DatasetSummary) {
    if (summary.bounding_box) {
      this.mapVisEl.zoomToBBox(transformBBox(summary.bounding_box));
      this.centerCamera = this.viewState;
    }
  }
}
</script>

<style scoped lang="scss"></style>
