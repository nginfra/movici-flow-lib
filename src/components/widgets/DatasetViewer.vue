<template>
  <MapVis ref="mapVis" :layer-infos="layers" :view-state.sync="viewState" scale>
    <template #control-zero="{ map, popup }">
      <template v-if="popup.mapPopups.length">
        <MapEntityPopup
          v-for="(p, i) in popup.mapPopups"
          :value="p"
          :key="i"
          :map="map"
          :view-state="viewState"
          @toggle="popup.togglePosition(p)"
          @close="popup.remove(p)"
        />
      </template>
    </template>
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
    <template #control-right="{ popup }">
      <EntitySelector :summary="summary" :currentDataset="value" @setLayerInfos="setLayerInfos" />
      <template v-if="popup.rightSidePopups.length">
        <RightSidePopup
          v-for="(p, i) in popup.rightSidePopups"
          :value="p"
          :key="i"
          @toggle="popup.togglePosition(p)"
          @close="popup.remove(p)"
        />
      </template>
    </template>
  </MapVis>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator';
import isEqual from 'lodash/isEqual';
import EntitySelector from './EntitySelector.vue';
import SearchBar from '@movici-flow-common/components/map/controls/SearchBar.vue';
import NavigationControl from '@movici-flow-common/components/map/controls/NavigationControl.vue';
import BaseMapControl from '@movici-flow-common/components/map/controls/BaseMapControl.vue';
import SummaryListing from '@movici-flow-common/mixins/SummaryListing';
import MapVis from '@movici-flow-common/components/map/MapVis.vue';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { CameraOptions, Dataset, DatasetSummary, Nullable } from '@movici-flow-common/types';
import defaults from '@movici-flow-common/components/map/defaults';
import { flowStore } from '@movici-flow-common/store/store-accessor';
import { transformBBox } from '@movici-flow-common/crs';
import MapEntityPopup from '@movici-flow-common/components/map_widgets/MapEntityPopup.vue';
import RightSidePopup from '@movici-flow-common/components/map_widgets/RightSidePopup.vue';

@Component({
  name: 'DatasetViewer',
  components: {
    MapVis,
    EntitySelector,
    SearchBar,
    NavigationControl,
    BaseMapControl,
    MapEntityPopup,
    RightSidePopup
  }
})
export default class DatasetViewer extends Mixins(SummaryListing) {
  @Prop({ type: Object }) readonly value?: Dataset;
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
  afterValue(curr?: Dataset, old?: Dataset) {
    if (curr) {
      this.currentDatasetUUID = curr.uuid;

      if (curr !== old) {
        this.setLayerInfos([]);
      }
    }
  }

  @Watch('summary')
  zoomToSummaryBBox(summary: DatasetSummary) {
    if (summary.bounding_box) {
      this.mapVisEl.zoomToBBox(transformBBox(summary.bounding_box, summary.epsg_code));
      this.centerCamera = this.viewState;
    }
  }
}
</script>

<style scoped lang="scss"></style>
