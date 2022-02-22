<template>
  <FlowContainer class="flow-datasets">
    <template #leftPanel>
      <ProjectInfoBox class="mb-2" v-if="hasProjectsCapabilities" />
      <span class="is-size-7">
        {{ $t('flow.datasets.label') }}
        <span class="count"
          >({{ filteredDatasets.length }} {{ $t('misc.of') }} {{ datasets.length }})</span
        >
      </span>
      <b-field>
        <b-input
          v-model="search"
          :placeholder="$t('flow.datasets.searchPlaceholder')"
          type="search"
          icon-pack="far"
          icon="search"
          size="is-small"
        >
        </b-input>
      </b-field>
      <b-field
        class="dataset-selector overflow-hover is-flex-grow-1 is-flex-shrink-2"
        v-if="filteredDatasets.length"
      >
        <ul class="flow-list is-size-7">
          <li
            v-for="dataset in filteredDatasets"
            @click="setDataset(dataset)"
            :key="dataset.uuid"
            :title="datasetDisplayTitleText(dataset)"
            :class="{ active: dataset.uuid === currentDatasetUUID }"
            v-html="datasetDisplayName(dataset)"
          ></li>
        </ul>
      </b-field>
      <b-button
        class="is-primary is-align-self-baseline flex-grow-0 flex-shrink-1"
        size="is-small"
        icon-left="plus-circle"
        disabled
      >
        {{ $t('flow.datasets.addDataset') }}
      </b-button>
    </template>
    <template #mainView>
      <!-- no dataset -->
      <template v-if="!currentDataset">
        <header>
          <div class="title-section">
            <h1 class="is-size-4 has-text-weight-bold">{{ $t('flow.datasets.label') }}</h1>
            <h2 class="is-size-6">{{ $t('flow.mainView.noDatasetText') }}</h2>
          </div>
        </header>
        <div class="no-resource">
          <b-image src="/static/no-resources.png" />
        </div>
      </template>
      <!-- yes dataset -->
      <template v-else>
        <header>
          <div class="title-section is-flex is-align-items-baseline">
            <h1
              class="is-size-4 mr-4 has-text-weight-bold"
              :title="datasetDisplayTitleText(currentDataset)"
              v-html="datasetDisplayName(currentDataset)"
            ></h1>
            <h2 class="is-flex-grow-1 is-size-6 has-text-weight-bold" :title="currentDataset.type">
              {{ $t('properties.type') }}:
              {{ currentDataset.type }}
            </h2>
          </div>
        </header>
        <b-tabs class="flow-tabs uppercase mt-2">
          <b-tab-item
            value="dataPreview"
            icon="map"
            icon-pack="far"
            :label="$t('flow.datasets.dataPreview')"
          >
            <MapVis :layer-infos="layers" :view-state.sync="viewState">
              <template #control-left="{ map, onViewstateChange, basemap, setBasemap }">
                <SearchBar
                  v-if="hasGeocodeCapabilities"
                  :map="map"
                  :view-state="viewState"
                  @update:view-state="onViewstateChange($event)"
                />
                <NavigationControl :value="viewState" @input="onViewstateChange($event)" />
                <BaseMapControl :value="basemap" @input="setBasemap" />
              </template>
              <template #control-right="{ map, popupContent, closePopup, viewState }">
                <EntitySelector
                  :datasetsArray="datasets"
                  :currentDataset="currentDataset"
                  @setLayerInfos="setLayerInfos"
                ></EntitySelector>
                <WidgetContainer
                  v-if="popupContent"
                  :value="popupContent"
                  :map="map"
                  :view-state="viewState"
                >
                  <DataViewContent @close="closePopup" :value="popupContent" :timestamp="0" />
                </WidgetContainer>
              </template>
            </MapVis>
          </b-tab-item>
          <b-tab-item
            disabled
            value="usage"
            icon="fa-scenario"
            icon-pack="fak"
            :label="$t('flow.datasets.usage')"
          >
          </b-tab-item>
          <b-tab-item
            disabled
            value="resume"
            icon-pack="far"
            icon="code"
            :label="$t('flow.datasets.resume')"
          >
          </b-tab-item>
          <b-tab-item value="info" icon="info-circle" icon-pack="fas" label="Info">
            <div class="info details is-size-7 mt-2">
              <span class="is-block" v-for="(prop, key) in details" :key="key">
                <label>{{ $t('flow.datasets.details.' + key) }}: </label>
                <span class="value">{{ prop }}</span>
              </span>
            </div>
            <div v-if="currentDataset.description" class="description is-size-6-half mt-4">
              {{ currentDataset.description }}
            </div>
          </b-tab-item>
        </b-tabs>
      </template>
    </template>
  </FlowContainer>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import pick from 'lodash/pick';
import isEqual from 'lodash/isEqual';
import { CameraOptions, Dataset, Nullable } from '../types';
import FlowContainer from './FlowContainer.vue';
import MapVis from './map/MapVis.vue';
import defaults from './map/defaults';
import EntitySelector from './widgets/EntitySelector.vue';
import ProjectInfoBox from './info_box/ProjectInfoBox.vue';
import SearchBar from './map/controls/SearchBar.vue';
import NavigationControl from './map/controls/NavigationControl.vue';
import BaseMapControl from './map/controls/BaseMapControl.vue';
import DataViewContent from './map_widgets/DataViewContent.vue';
import WidgetContainer from './map_widgets/WidgetContainer.vue';
import { ComposableVisualizerInfo } from '../visualizers/VisualizerInfo';
import { flowStore, flowUIStore } from '../store/store-accessor';
import { sortByKeys } from '@movici-flow-common/utils';

@Component({
  components: {
    FlowContainer,
    ProjectInfoBox,
    MapVis,
    EntitySelector,
    SearchBar,
    NavigationControl,
    BaseMapControl,
    DataViewContent,
    WidgetContainer
  }
})
export default class FlowDataset extends Vue {
  @Prop([String]) currentProjectName?: string;
  @Prop([String]) currentScenarioName?: string;
  currentDataset: Dataset | null = null;
  search = '';
  loading = false;
  viewState: Nullable<CameraOptions> = defaults.viewState();
  datasets: Dataset[] = [];
  layers: ComposableVisualizerInfo[] = [];

  get hasProjectsCapabilities() {
    return flowStore.hasProjectsCapabilities;
  }

  /**
   * return object with details of currentDataset while also adding filters to date attributes
   */
  get details() {
    const details = pick(this.currentDataset, ['created_on', 'last_modified', 'source', 'tags']);
    details.created_on = this.$options.filters?.dateString(details.created_on, true);
    details.last_modified = this.$options.filters?.dateString(details.last_modified, true);
    return details;
  }

  get currentDatasetUUID() {
    return this.currentDataset?.uuid || '';
  }

  /**
   * Filters out datasets by search
   */
  get filteredDatasets() {
    return this.datasets
      .filter(dataset => {
        const name = (dataset?.display_name || dataset.name).toLowerCase(),
          searchTerm = this.search.toLowerCase();
        return name.includes(searchTerm);
      })
      .sort(sortByKeys(['+display_name', '+name']));
  }

  get hasGeocodeCapabilities() {
    return flowStore.hasGeocodeCapabilities;
  }

  datasetDisplayName(dataset: Dataset) {
    if (dataset.display_name) {
      return `${dataset.display_name} <small>(${dataset.name})</small>`;
    } else {
      return dataset.name;
    }
  }

  datasetDisplayTitleText(dataset: Dataset) {
    if (dataset.display_name) {
      return `${dataset.display_name} (${dataset.name})`;
    } else {
      return dataset.name;
    }
  }

  setLayerInfos(layerInfos: ComposableVisualizerInfo[]) {
    if (!isEqual(this.layers, layerInfos)) {
      this.layers = layerInfos;
    }
  }

  setDataset(currentDataset: Dataset) {
    this.currentDataset = currentDataset;
  }

  async mounted() {
    flowUIStore.setLoading({ value: true, msg: 'Loading datasets...' });

    try {
      await flowStore.setupFlowStore({
        config: {
          currentProjectName: this.currentProjectName,
          getProject: true,
          currentScenarioName: this.currentScenarioName,
          getScenario: true,
          disableCollapser: true
        }
      });

      if (flowStore.hasProjectsCapabilities && !flowStore.hasProject) {
        await this.$router.push({ name: 'FlowProject' });
      }

      this.datasets = (await flowStore.getDatasets()) || [];

      flowUIStore.setLoading({ value: false });
    } catch (error) {
      console.error(error);
      await this.$router.push({ name: 'FlowProject' });
    }
  }
}
</script>

<style scoped lang="scss">
.details {
  label {
    color: $grey;
  }
}
</style>
