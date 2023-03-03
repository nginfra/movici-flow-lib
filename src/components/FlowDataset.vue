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
      <o-field>
        <o-input
          v-model="search"
          :placeholder="$t('flow.datasets.searchPlaceholder')"
          type="search"
          icon-pack="far"
          icon="search"
          size="small"
        >
        </o-input>
      </o-field>
      <o-field
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
      </o-field>
      <o-button
        class="is-primary is-align-self-baseline flex-grow-0 flex-shrink-1"
        size="small"
        icon-left="plus-circle"
        disabled
      >
        {{ $t('flow.datasets.addDataset') }}
      </o-button>
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
          <MovImage src="/static/no-resources.png" />
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
        <o-tabs class="flow-tabs uppercase mt-2">
          <o-tab-item
            value="dataPreview"
            icon="map"
            icon-pack="far"
            :label="$t('flow.datasets.dataPreview')"
          >
            <DatasetViewer v-model="currentDataset" />
          </o-tab-item>
          <o-tab-item
            disabled
            value="usage"
            icon="fa-scenario"
            icon-pack="fak"
            :label="$t('flow.datasets.usage')"
          >
          </o-tab-item>
          <o-tab-item
            disabled
            value="resume"
            icon-pack="far"
            icon="code"
            :label="$t('flow.datasets.resume')"
          >
          </o-tab-item>
          <o-tab-item value="info" icon="info-circle" icon-pack="fas" label="Info">
            <div class="info details is-size-7 mt-2">
              <span class="is-block" v-for="(prop, key) in details" :key="key">
                <label>{{ $t('flow.datasets.details.' + key) }}: </label>
                <span class="value">{{ prop }}</span>
              </span>
            </div>
            <div v-if="currentDataset.description" class="description is-size-6-half mt-4">
              {{ currentDataset.description }}
            </div>
          </o-tab-item>
        </o-tabs>
      </template>
    </template>
  </FlowContainer>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import pick from 'lodash/pick';
import { Dataset } from '../types';
import FlowContainer from './FlowContainer.vue';
import ProjectInfoBox from './info_box/ProjectInfoBox.vue';
import DatasetViewer from './widgets/DatasetViewer.vue';
import { flowStore, flowUIStore } from '../store/store-accessor';
import { MoviciError } from '@movici-flow-common/errors';
import { sortByKeys } from '@movici-flow-common/utils';

@Component({
  name: 'FlowDataset',
  components: {
    FlowContainer,
    ProjectInfoBox,
    DatasetViewer
  }
})
export default class FlowDataset extends Vue {
  @Prop({ type: String }) readonly currentProjectName?: string;
  @Prop({ type: String }) readonly currentScenarioName?: string;
  currentDataset: Dataset | null = null;
  search = '';
  datasets: Dataset[] = [];

  get currentDatasetUUID() {
    return this.currentDataset?.uuid;
  }

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

  setDataset(currentDataset: Dataset) {
    this.currentDataset = currentDataset;
  }

  async mounted() {
    flowUIStore.setLoading({ value: true, msg: 'Loading datasets...' });

    try {
      await flowStore.setupFlowStore({
        config: {
          currentProjectName: this.currentProjectName,
          needProject: true,
          currentScenarioName: this.currentScenarioName,
          needScenario: false,
          disableCollapser: true
        }
      });

      if (flowStore.hasProjectsCapabilities && !flowStore.hasProject) {
        await this.$router.push({ name: 'FlowProject' });
      }

      this.datasets = (await flowStore.getDatasets()) || [];

      flowUIStore.setLoading({ value: false });
    } catch (error) {
      flowUIStore.setLoading({ value: false });
      if (error instanceof MoviciError) {
        await error.handleError({
          $t: this.$t.bind(this),
          $router: this.$router,
          query: {
            project: this.currentProjectName
          }
        });
      }
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
