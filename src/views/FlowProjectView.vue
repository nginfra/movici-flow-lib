<template>
  <FlowStep class="flow-projects">
    <template #leftPanel>
      <ProjectInfoBox class="mb-2" edit />
      <div class="project-info" v-if="flowStore.project">
        <div class="details is-size-7 mb-3" v-if="details">
          <div class="mb-1" v-for="(prop, key) in details" :key="key">
            <label>{{ t("flow.projects.details." + key) }}: </label>
            <span class="value">{{ prop }}</span>
          </div>
        </div>
        <div class="count-details is-size-7 mb-3">
          <div class="mb-1">
            <label>{{ t("flow.projects.details.dataset_count") }}: </label>
            <a @click="flowStore.updateLocation({ step: 'dataset' })" role="link">
              {{ flowStore.project.dataset_count }}
            </a>
          </div>
          <div class="mb-1">
            <label>{{ t("flow.projects.details.scenario_count") }}: </label>
            <a @click="flowStore.updateLocation({ step: 'scenario' })" role="link">
              {{ flowStore.project.scenario_count }}
            </a>
          </div>
        </div>
      </div>
    </template>
    <template #mainView>
      <template v-if="!flowStore.project">
        <div class="no-resource">
          <MovImage src="/static/no-project.png"></MovImage>
          <div class="has-text-centered mt-3">
            <h1 class="is-size-4 has-text-weight-bold">{{ t("flow.mainView.noProjectTitle") }}</h1>
            <h2 class="is-size-6">{{ t("flow.mainView.noProjectText") }}</h2>
          </div>
        </div>
      </template>
      <template v-else>
        <MapVis :visualizer-infos="[]" v-model:view-state="viewState" scale>
          <template #control-left="{ map, onViewstateChange, basemap, setBasemap }">
            <MapControlSearchBar
              v-if="flowStore.hasCapability('geocode')"
              :map="map"
              :viewState="viewState"
              @update:viewState="onViewstateChange"
            />
            <MapControlNavigation :modelValue="viewState" @update:modelValue="onViewstateChange" />
            <MapControlBaseMap :modelValue="basemap" @update:modelValue="setBasemap" />
          </template>
        </MapVis>
      </template>
    </template>
  </FlowStep>
</template>

<script setup lang="ts">
import MapControlBaseMap from "@movici-flow-lib/components/mapControls/MapControlBaseMap.vue";
import MapControlNavigation from "@movici-flow-lib/components/mapControls/MapControlNavigation.vue";
import MapControlSearchBar from "@movici-flow-lib/components/mapControls/MapControlSearchBar.vue";
import MapVis from "@movici-flow-lib/components/MapVis.vue";
import { useMoviciSettings } from "@movici-flow-lib/baseComposables/useMoviciSettings";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { dateString } from "@movici-flow-lib/utils/filters";
import { computed, ref } from "vue";
import FlowStep from "../components/FlowStep.vue";
import ProjectInfoBox from "../components/ProjectInfoBox.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const flowStore = useFlowStore();
const viewState = ref(useMoviciSettings().settings.defaultViewState);
const details = computed(() => {
  if (flowStore.project) {
    return {
      created_on: dateString(flowStore.project.created_on),
    };
  }
  return null;
});
</script>

<style scoped></style>
