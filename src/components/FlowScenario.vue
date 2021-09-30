<template>
  <FlowContainer class="flow-scenarios">
    <template #leftPanel>
      <ProjectInfoBox class="mb-2" />
      <ScenarioInfoBox @setScenarioUUID="setScenarioUUID" class="mb-2" edit />
      <template v-if="currentScenario">
        <span class="is-size-7 mb-4 mt-1"> {{ $t('flow.scenarios.usedInScenario') }}: </span>
        <span class="is-size-7">
          <strong class="has-text-black">{{ $t('flow.scenarios.models') }}</strong>
          <span class="count">({{ currentScenario.models.length }})</span>
        </span>
        <b-field class="scenario-model-type-list overflow-hover is-flex-grow-0 is-flex-shrink-2">
          <ul class="flow-list is-size-7">
            <li v-for="(model, key) in currentScenario.models" :key="key" :title="model.name">
              {{ model.name | snakeToSpaces | upperFirst }}
            </li>
          </ul>
        </b-field>
        <span class="is-size-7">
          <strong class="has-text-black">{{ $t('flow.datasets.label') }}</strong>
          <span class="count">({{ currentScenario.datasets.length }})</span>
        </span>
        <b-field class="scenario-dataset-list overflow-hover is-flex-grow-0 is-flex-shrink-2">
          <ul class="flow-list is-size-7">
            <li v-for="(dataset, key) in currentScenario.datasets" :key="key" :title="dataset.name">
              {{ dataset.name | snakeToSpaces | upperFirst }}
            </li>
          </ul>
        </b-field>
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
          <b-image :src="require('@/flow/assets/no-resources.png')" />
        </div>
      </template>
      <template v-else class="is-flex is-flex-direction-column">
        <header>
          <div class="title-section is-flex">
            <h1
              class="is-size-4 is-flex-grow-1 has-text-weight-bold"
              :title="currentScenario.display_name"
            >
              {{ currentScenario.display_name }}
            </h1>
            <b-button class="is-warning mr-2" icon-pack="far" size="is-small" icon-left="undo"
              >Reset</b-button
            >
            <b-button
              class="is-primary"
              icon-pack="far"
              size="is-small"
              icon-left="redo"
              :disabled="isDisabled"
            >
              Run scenario
            </b-button>
          </div>
          <div class="status">
            <span class="is-size-7 mr-2">Status:</span>
            <span class="tag" :class="statusClass(currentScenario.status)">
              {{ currentScenario.status }}
            </span>
          </div>
        </header>
        <b-tabs class="flow-tabs uppercase mt-2" value="rawConfig">
          <b-tab-item
            disabled
            value="widgetDashboard"
            icon="sliders-h"
            icon-pack="far"
            :label="$t('flow.scenarios.widgetDashboard')"
          ></b-tab-item>
          <b-tab-item
            disabled
            value="configAssistant"
            icon="th-list"
            icon-pack="far"
            :label="$t('flow.scenarios.configAssistant')"
          ></b-tab-item>
          <b-tab-item
            value="rawConfig"
            icon-pack="far"
            icon="code"
            :label="$t('flow.scenarios.rawConfig')"
          >
            <b-input v-model="formattedRawData" type="textarea" readonly></b-input>
          </b-tab-item>
        </b-tabs>
      </template>
    </template>
  </FlowContainer>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { UUID } from '@/flow/src/types';
import FlowContainer from './FlowContainer.vue';
import { flowStore, flowUIStore } from '@/flow/src/store/store-accessor';
import { getClassFromStatus } from '@/flow/src/utils';
import ProjectInfoBox from './info_box/ProjectInfoBox.vue';
import ScenarioInfoBox from './info_box/ScenarioInfoBox.vue';

@Component({
  components: {
    FlowContainer,
    ProjectInfoBox,
    ScenarioInfoBox
  }
})
export default class FlowScenario extends Vue {
  @Prop([String]) currentProjectName?: string;
  @Prop([String]) currentScenarioName?: string;
  initialRawData!: string;

  get currentProject() {
    return flowStore.project;
  }

  get scenarios() {
    return flowStore.scenarios;
  }

  get currentScenarioUUID() {
    return flowStore.scenario?.uuid;
  }

  get currentScenario() {
    return flowStore.scenario;
  }

  get formattedRawData() {
    return JSON.stringify(this.currentScenario, null, 2);
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
    }

    // this replaces the query string with project
    if (this.currentScenarioName !== this.currentScenario?.name) {
      await this.$router.push({
        name: 'FlowScenario',
        query: {
          project: this.currentProject?.name,
          scenario: this.currentScenario?.name
        }
      });
      flowStore.updateCurrentView(null);
    }

    flowUIStore.setLoading({ value: false });
  }

  statusClass(type: string) {
    return getClassFromStatus(type);
  }

  /**
   * Checks whether there are props for project and scenario.
   * If there is a project, we set in the component, which triggers the watcher
   * Else, redirect to beggining of Flow.
   *
   * If there's also a prop for scenario, set that scenario in the component
   */
  async mounted() {
    const config = {
      currentProjectName: this.currentProjectName,
      getProject: true,
      currentScenarioName: this.currentScenarioName,
      getScenario: true
    };

    flowUIStore.setLoading({ value: true, msg: 'Loading scenarios...' });

    try {
      await flowStore.setupFlowStore({ config });
      flowUIStore.setLoading({ value: false });
    } catch (error) {
      console.error(error);
      await this.$router.push({ name: 'FlowProjects' });
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
    ::v-deep .textarea {
      max-height: unset !important;
      min-height: unset !important;
      height: inherit !important;
      width: 100% !important;
      resize: none;
      font-family: monospace;
      color: #000;
      font-size: 0.875em;
      padding: 1.5rem;
      white-space: pre;
      word-wrap: normal;
      background-color: #f5f5f5 !important;
      border-radius: unset;
      border: none !important;
      overflow: hidden;
      &:hover {
        overflow: auto;
      }
    }
  }
}
</style>
