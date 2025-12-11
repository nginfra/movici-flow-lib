<template>
  <FlowContainer class="flow-datasets">
    <template #leftPanel>
      <ProjectInfoBox class="mb-2" v-if="store.hasCapability('projects')" />
      <span class="is-size-7">
        {{ t("flow.datasets.label") }}
        <span class="count"
          >({{ filteredDatasets.length }} {{ t("misc.of") }} {{ store.datasets.length }})</span
        >
      </span>
      <o-field>
        <o-input
          v-model="search"
          :placeholder="t('flow.datasets.searchPlaceholder')"
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
            v-for="ds in filteredDatasets"
            @click="dataset = ds"
            :key="ds.uuid"
            :title="datasetDisplayTitleText(ds)"
            :class="{ active: ds.uuid === dataset?.uuid }"
            v-html="datasetDisplayName(ds)"
          ></li>
        </ul>
      </o-field>
      <o-button
        class="is-primary is-align-self-baseline flex-grow-0 flex-shrink-1"
        size="small"
        icon-left="plus-circle"
        disabled
      >
        {{ t("dataset.addNew") }}
      </o-button>
    </template>
    <template #mainView>
      <!-- no dataset -->
      <template v-if="!dataset">
        <header>
          <div class="title-section">
            <h1 class="is-size-4 has-text-weight-bold">{{ t("flow.datasets.label") }}</h1>
            <h2 class="is-size-6">{{ t("flow.mainView.noDatasetText") }}</h2>
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
              :title="datasetDisplayTitleText(dataset)"
              v-html="datasetDisplayName(dataset)"
            ></h1>
            <h2 class="is-flex-grow-1 is-size-6 has-text-weight-bold" :title="dataset.type">
              {{ t("properties.type") }}:
              {{ dataset.type }}
            </h2>
          </div>
        </header>
        <o-tabs class="flow-tabs uppercase mt-2">
          <o-tab-item
            value="dataPreview"
            icon="map"
            icon-pack="far"
            :label="t('flow.datasets.dataPreview')"
          >
            <DatasetViewer v-model="dataset" />
          </o-tab-item>
          <o-tab-item
            disabled
            value="usage"
            icon="fa-scenario"
            icon-pack="fak"
            :label="t('flow.datasets.usage')"
          >
          </o-tab-item>
          <o-tab-item
            disabled
            value="resume"
            icon-pack="far"
            icon="code"
            :label="t('flow.datasets.summary')"
          >
          </o-tab-item>
          <o-tab-item value="info" icon="info-circle" icon-pack="fas" label="Info">
            <div class="info details is-size-7 mt-2">
              <span class="is-block" v-for="(prop, key) in details" :key="key">
                <label>{{ t("flow.datasets.details." + key) }}: </label>
                <span class="value">{{ prop }}</span>
              </span>
            </div>
          </o-tab-item>
        </o-tabs>
      </template>
    </template>
  </FlowContainer>
</template>

<script setup lang="ts">
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { sortByKeys } from "@movici-flow-lib/utils";
import { dateString } from "@movici-flow-lib/utils/filters";
import { computed, ref } from "vue";
import FlowContainer from "../components/FlowStep.vue";
import type { ShortDataset } from "../types";
import ProjectInfoBox from "@movici-flow-lib/components/ProjectInfoBox.vue";
import DatasetViewer from "@movici-flow-lib/components/DatasetViewer.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const store = useFlowStore();

const dataset = ref<ShortDataset>();

const search = ref("");
const filteredDatasets = computed(() => {
  const searchTerm = search.value.toLowerCase();

  return store.datasets
    .filter((dataset) => {
      return (
        dataset.display_name?.toLowerCase().includes(searchTerm) ||
        dataset.name.toLowerCase().includes(searchTerm)
      );
    })
    .sort(sortByKeys(["+display_name", "+name"]));
});

function datasetDisplayName(dataset: ShortDataset) {
  if (dataset.display_name) {
    return `${dataset.display_name} <small>(${dataset.name})</small>`;
  } else {
    return dataset.name;
  }
}

function datasetDisplayTitleText(dataset: ShortDataset) {
  if (dataset.display_name) {
    return `${dataset.display_name} (${dataset.name})`;
  } else {
    return dataset.name;
  }
}

const details = computed(() => {
  if (!dataset.value) return {};
  return {
    created_on: dateString(dataset.value.created_on),
    last_modified: dateString(dataset.value.last_modified),
  };
});
</script>

<style scoped lang="scss">
.details {
  label {
    color: $grey;
  }
}
</style>
