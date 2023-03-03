<template>
  <FlowContainer class="flow-scenarios">
    <template #leftPanel>
      <ProjectInfoBox class="mb-2" v-if="hasProjectsCapabilities" />
      <ScenarioInfoBox @setScenarioUUID="setScenarioUUID" class="mb-2" edit />
      <template v-if="currentScenario">
        <span class="is-size-7 mb-4 mt-1"> {{ $t('flow.scenarios.usedInScenario') }}: </span>
        <span class="is-size-7">
          <strong class="has-text-black">{{ $t('flow.scenarios.models') }}</strong>
          <span class="count">({{ currentScenario.models.length }})</span>
        </span>
        <o-field class="scenario-model-type-list overflow-hover is-flex-grow-0 is-flex-shrink-2">
          <ul class="flow-list is-size-7">
            <li v-for="(model, key) in scenarioModels" :key="key" :title="model.name">
              {{ model.name }}
            </li>
          </ul>
        </o-field>
        <span class="is-size-7">
          <strong class="has-text-black">{{ $t('flow.datasets.label') }}</strong>
          <span class="count">({{ currentScenario.datasets.length }})</span>
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
      <template v-if="!currentScenario">
        <header>
          <h1 class="is-size-4 has-text-weight-bold">{{ $t('flow.scenarios.label') }}</h1>
          <h2 class="is-size-6">{{ $t('flow.mainView.noScenarioText') }}</h2>
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
              :title="currentScenario.display_name"
            >
              {{ currentScenario.display_name }}
            </h1>
            <o-button class="is-warning mr-2" icon-pack="far" size="small" icon-left="undo">
              Reset
            </o-button>
            <o-button
              class="is-primary"
              icon-pack="far"
              size="small"
              icon-left="redo"
              :disabled="isDisabled"
            >
              Run scenario
            </o-button>
          </div>
          <div class="status">
            <span class="is-size-7 mr-2">Status:</span>
            <span class="tag" :class="getClassFromStatus(currentScenario.status)">
              {{ currentScenario.status }}
            </span>
          </div>
        </header>
        <o-tabs class="flow-tabs uppercase mt-2" value="rawConfig">
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
            <o-input
              v-model="formattedRawData"
              type="textarea"
              class="is-monospace"
              readonly
            ></o-input>
          </o-tab-item>
        </o-tabs>
      </template>
    </template>
  </FlowContainer>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Scenario, UUID } from '../types';
import FlowContainer from './FlowContainer.vue';
import { flowStore, flowUIStore, flowVisualizationStore } from '../store/store-accessor';
import { buildFlowUrl, sortByKeys, getClassFromStatus } from '../utils';
import ProjectInfoBox from './info_box/ProjectInfoBox.vue';
import ScenarioInfoBox from './info_box/ScenarioInfoBox.vue';
import { MoviciError } from '@movici-flow-common/errors';

@Component({
  name: 'FlowScenario',
  components: {
    FlowContainer,
    ProjectInfoBox,
    ScenarioInfoBox
  }
})
export default class FlowScenario extends Vue {
  @Prop({ type: String }) readonly currentProjectName?: string;
  @Prop({ type: String }) readonly currentScenarioName?: string;
  initialRawData!: string;

  get hasProjectsCapabilities() {
    return flowStore.hasProjectsCapabilities;
  }

  get currentProject() {
    return flowStore.project;
  }

  get scenarios() {
    return flowStore.scenarios;
  }

  get currentScenarioUUID() {
    return flowStore.scenario?.uuid;
  }

  get currentScenario(): Scenario | null {
    return flowStore.scenario;
  }

  get formattedRawData() {
    return JSON.stringify(this.currentScenario, null, 2);
  }

  get scenarioModels() {
    return this.currentScenario?.models?.sort(sortByKeys(['+name'])) ?? [];
  }

  get scenarioDatasets() {
    return this.currentScenario?.datasets?.sort(sortByKeys(['+name'])) ?? [];
  }

  get isDisabled() {
    return true;
  }
  /**
   * Watcher for current scenario, receives a scenario object, sets it in the store,
   * requests a detailed version of it and updates main Flow component.
   * If necessary, updates the route with its name as the scenario query parameter
   */
  async setScenarioUUID(currentScenarioUUID: UUID) {
    flowUIStore.setLoading({ value: true, msg: 'Loading scenario details...' });
    const fullScenario = await flowStore.getScenario(currentScenarioUUID);

    if (fullScenario) {
      await flowStore.setCurrentFlowScenario(fullScenario);
      await flowVisualizationStore?.getViewsByScenario(fullScenario.uuid);
    }

    // this replaces the query string with project
    if (this.currentScenarioName !== this.currentScenario?.name) {
      await this.$router.push(
        buildFlowUrl('FlowScenario', {
          project: this.currentProject?.name,
          scenario: this.currentScenario?.name
        })
      );
      flowVisualizationStore.updateCurrentView(null);
    }

    flowUIStore.setLoading({ value: false });
  }

  getClassFromStatus = getClassFromStatus;

  /**
   * Checks whether there are props for project and scenario.
   * If there is a project, we set in the component, which triggers the watcher
   * Else, redirect to beggining of Flow.
   *
   * If there's also a prop for scenario, set that scenario in the component
   */
  async mounted() {
    flowUIStore.setLoading({ value: true, msg: 'Loading scenarios...' });

    try {
      await flowStore.setupFlowStore({
        config: {
          currentProjectName: this.currentProjectName,
          needProject: true,
          currentScenarioName: this.currentScenarioName,
          needScenario: false
        }
      });
      flowUIStore.setLoading({ value: false });
    } catch (error) {
      flowUIStore.setLoading({ value: false });
      if (error instanceof MoviciError) {
        await error.handleError({
          $t: this.$t.bind(this),
          $router: this.$router,
          query: {
            project: this.currentProjectName,
            scenario: this.currentScenarioName
          }
        });
      }
    }
  }
}
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
