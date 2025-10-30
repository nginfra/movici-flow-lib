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
            <div class="raw-config-editor">
              <div class="editor-toolbar mb-3">
                <o-button 
                  class="is-primary mr-2" 
                  size="small" 
                  icon-pack="far" 
                  icon-left="save"
                  :disabled="!hasConfigChanges || isSaving"
                  :loading="isSaving"
                  @click="saveConfig"
                >
                  {{ isSaving ? 'Saving...' : 'Save' }}
                </o-button>
                <o-button 
                  class="is-light" 
                  size="small" 
                  icon-pack="far" 
                  icon-left="undo"
                  :disabled="!hasConfigChanges"
                  @click="resetConfig"
                >
                  Reset
                </o-button>
                <o-notification 
                  v-if="saveMessage" 
                  class="ml-3 is-inline-block"
                  :variant="saveMessage.type"
                  auto-close
                  :duration="3000"
                  @close="saveMessage = null"
                >
                  {{ saveMessage.text }}
                </o-notification>
              </div>
              <o-input 
                v-model="editableConfigData" 
                type="textarea" 
                class="is-monospace config-textarea" 
                :class="{ 'has-error': configError }"
                placeholder="Enter scenario configuration JSON..."
                rows="20"
              />
              <div v-if="configError" class="error-message mt-2">
                <span class="has-text-danger">{{ configError }}</span>
              </div>
            </div>
          </o-tab-item>
        </o-tabs>
      </template>
    </template>
  </FlowContainer>
</template>

<script setup lang="ts">
import ProjectInfoBox from "@movici-flow-lib/components/ProjectInfoBox.vue";
import ScenarioInfoBox from "@movici-flow-lib/components/ScenarioInfoBox.vue";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { computed, ref, watch } from "vue";
import FlowContainer from "../components/FlowStep.vue";
import type { Scenario } from "../types";
import { getClassFromStatus, sortByKeys } from "../utils";

const store = useFlowStore();

const scenario = ref<Scenario | null>();
const editableConfigData = ref<string>('');
const originalConfigData = ref<string>('');
const isSaving = ref<boolean>(false);
const configError = ref<string>('');
const saveMessage = ref<{type: string, text: string} | null>(null);

const scenarioModels = computed(() => {
  return [...(scenario.value?.models ?? [])].sort(sortByKeys(["+name"])) ?? [];
});

const scenarioDatasets = computed(() => {
  return [...(scenario.value?.datasets ?? [])].sort(sortByKeys(["+name"])) ?? [];
});

const formattedRawData = computed(() => {
  return JSON.stringify(scenario.value, null, 2);
});

const hasConfigChanges = computed(() => {
  return editableConfigData.value !== originalConfigData.value;
});

// Validate JSON and update error state
const validatedConfig = () => {
  try {
    const result = JSON.parse(editableConfigData.value);
    configError.value = '';
    return result;
  } catch (error) {
    configError.value = `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
    return null;
  }
};

// Save configuration
const saveConfig = async () => {
  if (!store.scenario?.uuid) return;
  
  const result = validatedConfig();
  
  if (!result) {
    return;
  }
  
  isSaving.value = true;
  saveMessage.value = null;
  
  try {
    await store.backend?.scenario.update(store.scenario.uuid, result);
    originalConfigData.value = editableConfigData.value;
    
    // Refresh scenario data
    scenario.value = await store.backend?.scenario.get(store.scenario.uuid);
    
    saveMessage.value = {
      type: 'success',
      text: 'Configuration saved successfully!'
    };
  } catch (error) {
    saveMessage.value = {
      type: 'danger',
      text: `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  } finally {
    isSaving.value = false;
  }
};

// Reset configuration to original
const resetConfig = () => {
  editableConfigData.value = originalConfigData.value;
  configError.value = '';
  saveMessage.value = null;
};

watch(
  () => store.scenario,
  async () => {
    if (!store.scenario) return;
    scenario.value = await store.backend?.scenario.get(store.scenario.uuid);
    // Initialize editable config data
    const configStr = JSON.stringify(scenario.value, null, 2);
    editableConfigData.value = configStr;
    originalConfigData.value = configStr;
  },
  { immediate: true }
);

// Validate JSON on input change
watch(editableConfigData, () => {
  if (editableConfigData.value.trim()) {
    validatedConfig();
  }
});
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

.raw-config-editor {
  .editor-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .config-textarea {
    font-family: 'Courier New', monospace !important;
    
    textarea {
      min-height: 400px;
      font-size: 12px;
      line-height: 1.4;
    }
    
    &.has-error textarea {
      border-color: $danger !important;
    }
  }

  .error-message {
    font-size: 0.875rem;
    padding: 0.5rem;
    background-color: lighten($danger, 45%);
    border: 1px solid $danger;
    border-radius: 4px;
  }
}
</style>
