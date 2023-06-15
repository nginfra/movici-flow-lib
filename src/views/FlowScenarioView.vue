<template>
  <FlowContainer class="flow-scenarios">
    <template #leftPanel>
      <ProjectInfoBox class="mb-2" v-if="store.hasCapability('projects')" />
      <ScenarioInfoBox class="mb-2" editable />
      <template v-if="scenario">
        <span class="is-size-7 mb-4 mt-1"> {{ $t("flow.scenarios.usedInScenario") }}: </span>
        <span class="is-size-7">
          <strong class="has-text-black">{{ $t("flow.scenarios.models") }}</strong>
          <span class="count">({{ (scenario.models ?? []).length }})</span>
        </span>
        <o-field class="scenario-model-type-list overflow-hover is-flex-grow-0 is-flex-shrink-2">
          <ul class="flow-list is-size-7">
            <li v-for="(model, key) in scenarioModels" :key="key" :title="model.name">
              {{ model.name }}
            </li>
          </ul>
        </o-field>
        <span class="is-size-7">
          <strong class="has-text-black">{{ $t("flow.datasets.label") }}</strong>
          <span class="count">({{ scenario.datasets.length }})</span>
        </span>
        <o-field class="scenario-dataset-list overflow-hover is-flex-grow-0 is-flex-shrink-2">
          <ul class="flow-list is-size-7">
            <li v-for="(dataset, key) in scenarioDatasets" :key="key" :title="dataset.name">
              {{ dataset.name }}
            </li>
          </ul>
        </o-field>
        <div class="clear flex-grow-0 flex-shrink-1"></div>
      </template>
    </template>
    <template #mainView>
      <template v-if="!scenario">
        <header>
          <h1 class="is-size-4 has-text-weight-bold">{{ $t("flow.scenarios.label") }}</h1>
          <h2 class="is-size-6">{{ $t("flow.mainView.noScenarioText") }}</h2>
        </header>
        <div class="no-resource">
          <MovImage src="/static/no-resources.png" />
        </div>
      </template>
      <template v-else>
        <header class="is-flex is-flex-direction-column">
          <div class="title-section is-flex">
            <h1
              class="is-size-4 is-flex-grow-1 has-text-weight-bold"
              :title="scenario.display_name"
            >
              {{ scenario.display_name }}
            </h1>
            <o-button
              class="is-warning mr-2"
              icon-pack="far"
              size="small"
              icon-left="undo"
              disabled
            >
              Reset
            </o-button>
            <o-button class="is-primary" icon-pack="far" size="small" icon-left="redo" disabled>
              Run scenario
            </o-button>
          </div>
          <div class="status">
            <span class="is-size-7 mr-2">Status:</span>
            <span class="tag" :class="getClassFromStatus(scenario?.status ?? '')">
              {{ scenario.status }}
            </span>
          </div>
        </header>
        <o-tabs class="flow-tabs uppercase mt-2" modelValue="rawConfig">
          <o-tab-item
            disabled
            value="widgetDashboard"
            icon="sliders-h"
            icon-pack="far"
            :label="$t('flow.scenarios.widgetDashboard')"
          ></o-tab-item>
          <o-tab-item
            disabled
            value="configAssistant"
            icon="th-list"
            icon-pack="far"
            :label="$t('flow.scenarios.configAssistant')"
          ></o-tab-item>
          <o-tab-item
            value="rawConfig"
            icon-pack="far"
            icon="code"
            :label="$t('flow.scenarios.rawConfig')"
          >
            <o-input v-model="formattedRawData" type="textarea" class="is-monospace" readonly />
          </o-tab-item>
        </o-tabs>
      </template>
    </template>
  </FlowContainer>
</template>

<script setup lang="ts">
import ProjectInfoBox from "@movici-flow-common/components/ProjectInfoBox.vue";
import ScenarioInfoBox from "@movici-flow-common/components/ScenarioInfoBox.vue";
import { useFlowStore } from "@movici-flow-common/stores/flow";
import { computed, ref, watch } from "vue";
import FlowContainer from "../components/FlowStep.vue";
import type { Scenario } from "../types";
import { getClassFromStatus, sortByKeys } from "../utils";

const store = useFlowStore();

const scenario = ref<Scenario | null>();

const scenarioModels = computed(() => {
  return [...(scenario.value?.models ?? [])].sort(sortByKeys(["+name"])) ?? [];
});

const scenarioDatasets = computed(() => {
  return [...(scenario.value?.datasets ?? [])].sort(sortByKeys(["+name"])) ?? [];
});

const formattedRawData = computed(() => {
  return JSON.stringify(scenario.value, null, 2);
});

watch(
  () => store.scenario,
  async () => {
    if (!store.scenario) return;
    scenario.value = await store.backend?.scenario.get(store.scenario.uuid);
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.field {
  &.scenario-model-type-list,
  &.scenario-dataset-list {
    .flow-list li {
      color: $grey;
      cursor: unset !important;
      &:hover {
        background-color: unset !important;
      }
    }
  }
}

header {
  .title-section {
    h1 {
      margin-right: auto;
      max-width: 700px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
.tab-item {
  .control {
    height: inherit !important;
  }
}
</style>
