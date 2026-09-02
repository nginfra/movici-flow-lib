<template>
  <div class="configuration-assistant">
    <div ref="canvasRef" class="configuration-assistant-grid three-columns">
      <svg
        v-if="modelDatasetConnections.length"
        class="configuration-assistant-connections"
        :viewBox="`0 0 ${canvasSize.width} ${canvasSize.height}`"
        preserveAspectRatio="none"
      >
        <g
          v-for="modelDatasetConnection in modelDatasetConnections"
          :key="modelDatasetConnection.id"
          :class="modelDatasetConnection.active ? 'active' : 'inactive'"
        >
          <path :d="modelDatasetConnection.path" />
          <circle
            :cx="modelDatasetConnection.start.x"
            :cy="modelDatasetConnection.start.y"
            :r="CONNECTION_MARKER_RADIUS"
          />
          <circle
            :cx="modelDatasetConnection.end.x"
            :cy="modelDatasetConnection.end.y"
            :r="CONNECTION_MARKER_RADIUS"
          />
        </g>
      </svg>

      <section class="configuration-assistant-panel">
        <header class="configuration-assistant-panel__header">
          <h2>
            {{ t("flow.scenarios.models") }}
            <span class="count">({{ modelLaneList.length }})</span>
          </h2>
          <button
            type="button"
            class="configuration-panel-add-button"
            @click="openCreateModelModal"
          >
            +
          </button>
        </header>

        <div
          class="config-assistant-panel__body"
          @dragover.prevent
          @drop.prevent="dropModelIntoLane"
        >
          <Draggable
            :modelValue="modelLaneList"
            item-key="name"
            v-bind="modelDraggableOptions"
            class="config-assistant-list"
            @change="changeModelLane"
          >
            <template #item="{ element: model }">
              <article
                :ref="(element) => setCardRef(modelCardRefs, model.name, element)"
                class="config-assistant-card"
                :class="{ 'is-selected': selectedModelName === model.name }"
                @click="selectModel(model.name)"
              >
                <div class="config-assistant-card__row">
                  <span
                    class="config-assistant-card__drag-handle grip"
                    title="Drag to reorder"
                    aria-label="Drag to reorder"
                    @click.stop
                  >
                    <o-icon pack="fas" icon="grip-vertical" size="small" />
                  </span>
                  <span class="config-assistant-card__title">{{ model.name }}</span>
                  <button
                    type="button"
                    class="config-assistant-card__icon-button"
                    :title="t('actions.edit')"
                    :aria-label="t('actions.edit')"
                    @click.stop="openEditModelModal(model.name)"
                  >
                    <o-icon pack="fas" icon="pen" size="small" />
                  </button>
                  <button
                    type="button"
                    class="config-assistant-card__icon-button"
                    :title="t('actions.delete')"
                    :aria-label="t('actions.delete')"
                    @click.stop="deleteModel(model.name)"
                  >
                    <o-icon pack="far" icon="trash-alt" size="small" />
                  </button>
                </div>
                <p class="config-assistant-card__subtitle">{{ formatModelType(model.type) }}</p>
              </article>
            </template>
            <template #footer>
              <div v-if="!modelLaneList.length" class="configuration-assistant-empty-state">
                <p>{{ t("flow.configurationAssistant.scenarioSettings.emptyModels") }}</p>
              </div>
            </template>
          </Draggable>
        </div>
      </section>

      <section class="configuration-assistant-panel">
        <header class="configuration-assistant-panel__header">
          <h2>
            {{ t("resources.datasets") }}
            <span class="count">({{ datasetLaneList.length }})</span>
          </h2>
          <button
            type="button"
            class="configuration-panel-add-button"
            @click="openCreateDatasetModal"
          >
            +
          </button>
        </header>

        <div
          class="config-assistant-panel__body"
          @dragover.prevent
          @drop.prevent="dropDatasetIntoLane"
        >
          <Draggable
            :modelValue="datasetLaneList"
            item-key="uuid"
            v-bind="datasetDraggableOptions"
            class="config-assistant-list"
            @change="changeDatasetLane"
          >
            <template #item="{ element: dataset }">
              <article
                :ref="(element) => setCardRef(datasetCardRefs, dataset.name, element)"
                class="config-assistant-card"
                :class="{ 'is-linked': connectedDatasetNames.has(dataset.name) }"
              >
                <div class="config-assistant-card__row">
                  <span
                    class="config-assistant-card__drag-handle grip"
                    title="Drag to reorder"
                    aria-label="Drag to reorder"
                    @click.stop
                  >
                    <o-icon pack="fas" icon="grip-vertical" size="small" />
                  </span>
                  <span class="config-assistant-card__title">{{ dataset.name }}</span>
                  <button
                    type="button"
                    class="config-assistant-card__icon-button"
                    :title="t('actions.edit')"
                    :aria-label="t('actions.edit')"
                    @click.stop="openEditDatasetModal(dataset.name)"
                  >
                    <o-icon pack="fas" icon="pen" size="small" />
                  </button>
                  <button
                    type="button"
                    class="config-assistant-card__icon-button"
                    :title="t('actions.delete')"
                    :aria-label="t('actions.delete')"
                    @click.stop="deleteDataset(dataset.name)"
                  >
                    <o-icon pack="far" icon="trash-alt" size="small" />
                  </button>
                </div>
              </article>
            </template>
            <template #footer>
              <div v-if="!datasetLaneList.length" class="configuration-assistant-empty-state">
                <p>{{ t("flow.configurationAssistant.scenarioSettings.emptyDatasets") }}</p>
              </div>
            </template>
          </Draggable>
        </div>
      </section>

      <section class="configuration-assistant-panel">
        <header class="configuration-assistant-panel__header">
          <h2>{{ props.modelValue.display_name || props.modelValue.name }}</h2>
        </header>

        <div class="config-assistant-panel__body config-assistant-panel__body--details">
          <div class="scenario-form">
            <div class="scenario-form__row">
              <label>{{ t("properties.name") }}:</label>
              <o-input
                size="small"
                :modelValue="props.modelValue.name"
                @update:modelValue="updateScenarioText('name', $event)"
              />
            </div>

            <div class="scenario-form__row">
              <label>{{ t("properties.displayName") }}:</label>
              <o-input
                size="small"
                :modelValue="props.modelValue.display_name"
                @update:modelValue="updateScenarioText('display_name', $event)"
              />
            </div>

            <div class="scenario-form__row">
              <label>{{ t("properties.description") }}:</label>
              <o-input
                size="small"
                type="textarea"
                :modelValue="props.modelValue.description ?? ''"
                @update:modelValue="updateScenarioText('description', $event)"
              />
            </div>
          </div>

          <div class="scenario-form">
            <div class="scenario-form__row">
              <label>{{ t("flow.configurationAssistant.scenarioSettings.mode") }}:</label>
              <o-select
                size="small"
                expanded
                :modelValue="modeOptionValue"
                @update:modelValue="updateSimulationMode($event)"
              >
                <option
                  v-for="option in simulationModeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </o-select>
            </div>

            <div class="scenario-form__row">
              <label>{{ t("properties.timeScale") }}:</label>
              <div class="compound-field">
                <o-input
                  size="small"
                  type="number"
                  min="0"
                  :modelValue="timeScaleForm.value"
                  @update:modelValue="updateTimeScaleValue($event)"
                />
                <o-select
                  size="small"
                  expanded
                  :modelValue="timeScaleForm.unit"
                  @update:modelValue="updateTimeScaleUnit($event)"
                >
                  <option v-for="unit in timeUnits" :key="unit.value" :value="unit.value">
                    {{ unit.label }}
                  </option>
                </o-select>
              </div>
            </div>

            <button
              type="button"
              class="scenario-advanced-toggle"
              @click="showScenarioAdvancedSettings = !showScenarioAdvancedSettings"
            >
              <o-icon
                pack="far"
                size="small"
                :icon="showScenarioAdvancedSettings ? 'angle-down' : 'angle-right'"
              />
              <span>{{ t("flow.configurationAssistant.scenarioSettings.advanced") }}</span>
            </button>

            <div v-if="showScenarioAdvancedSettings" class="scenario-form mt-4">
              <div class="scenario-form__row">
                <label>{{ t("flow.configurationAssistant.scenarioSettings.epsgCode") }}:</label>
                <o-input
                  size="small"
                  type="number"
                  :modelValue="props.modelValue.epsg_code ?? ''"
                  @update:modelValue="updateEPSGCode($event)"
                />
              </div>

              <div class="scenario-form__row">
                <label
                  >{{ t("flow.configurationAssistant.scenarioSettings.referenceTime") }}:</label
                >
                <o-input
                  size="small"
                  type="datetime-local"
                  :modelValue="referenceTimeInput"
                  @update:modelValue="updateReferenceTime($event)"
                />
              </div>

              <div class="scenario-form__row scenario-form__row--stacked">
                <label>{{ t("properties.duration") }}:</label>
                <div class="compound-field">
                  <o-input
                    size="small"
                    type="number"
                    min="0"
                    :modelValue="durationForm.value"
                    @update:modelValue="updateDurationValue($event)"
                  />
                  <o-select
                    size="small"
                    expanded
                    :modelValue="durationForm.unit"
                    @update:modelValue="updateDurationUnit($event)"
                  >
                    <option v-for="unit in timeUnits" :key="unit.value" :value="unit.value">
                      {{ unit.label }}
                    </option>
                  </o-select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModelConfigurationModal
        v-model:active="isModelModalActive"
        :model="editingModel"
        :model-type-options="modelTypeOptions"
        :scenario-datasets="props.modelValue.datasets"
        :dataset-summaries="datasetSummaries"
        @save="saveModel"
      />

      <DatasetConfigurationModal
        v-model:active="isDatasetModalActive"
        :dataset="editingDataset"
        @save="saveDataset"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSummaryStore } from "@movici-flow-lib/stores/summary";
import {
  SimulationMode,
  type DatasetSummary,
  type Scenario,
  type ScenarioDataset,
  type ScenarioModel,
  type ShortDataset,
  type TimeOrientedSimulationInfo,
} from "@movici-flow-lib/types";
import { computed, nextTick, onBeforeUnmount, ref, watch, type ComponentPublicInstance } from "vue";
import { useI18n } from "vue-i18n";
import ModelConfigurationModal from "./ModelConfigurationModal.vue";
import DatasetConfigurationModal from "./DatasetConfigurationModal.vue";
import type { ModelTypeOption } from "./types.ts";
import { MODEL_SCHEMA_TYPES, modelSchemas } from "./modelSchemas.ts";
import { transformDatasetReferences } from "./schemaUtils.ts";
import { snakeToFriendly } from "@movici-flow-lib/utils/filters.ts";
import { cloneDeep } from "lodash";
import Draggable from "vuedraggable";
import { useDraggable } from "@movici-flow-lib/composables/useDraggable.ts";

const CONNECTION_MARKER_RADIUS = 5;
const CONNECTION_MARKER_GAP = CONNECTION_MARKER_RADIUS + 1;

const emit = defineEmits<{
  (e: "update:modelValue", val: Scenario): void;
}>();

const { t } = useI18n();

const summaryStore = useSummaryStore();

const props = defineProps<{
  modelValue: Scenario;
  availableDatasets?: ShortDataset[];
}>();

type ScenarioTextField = "name" | "display_name" | "description";
type TimeUnitValue = "seconds" | "minutes" | "hours" | "days";
type TimeUnitOption = { value: TimeUnitValue; label: string; seconds: number };

type DraggableChangeEvent<T> = {
  added?: { element: T; newIndex: number };
  moved?: { oldIndex: number; newIndex: number };
};

type ModelDatasetConnection = {
  id: string;
  modelName: string;
  path: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  active: boolean;
};

const defaultTimeUnit: TimeUnitOption = {
  value: "seconds",
  label: t("time.seconds"),
  seconds: 1,
};

const timeUnits: TimeUnitOption[] = [
  defaultTimeUnit,
  { value: "minutes", label: t("time.minutes"), seconds: 60 },
  { value: "hours", label: t("time.hours"), seconds: 3600 },
  { value: "days", label: t("time.days"), seconds: 86400 },
];

const timeScaleForm = ref<{ value: number; unit: TimeUnitValue }>({
  value: 1,
  unit: "seconds",
});

const durationForm = ref<{ value: number; unit: TimeUnitValue }>({
  value: 1,
  unit: "minutes",
});

const modelList = computed(() => props.modelValue.models ?? []);

const { draggableOptions, move } = useDraggable(modelList);

const modelDraggableOptions = {
  ...draggableOptions,
  group: {
    name: "configuration-assistant-models",
    pull: false,
    put: false,
  },
};

const datasetDraggableOptions = {
  ...draggableOptions,
  group: {
    name: "configuration-assistant-datasets",
    pull: false,
    put: false,
  },
};

const canvasRef = ref<HTMLElement | null>(null);
const canvasSize = ref({ width: 0, height: 0 });

const modelLaneNames = ref<string[]>([]);
const modelDatasetConnections = ref<ModelDatasetConnection[]>([]);

const datasetSummaries = ref<Record<string, DatasetSummary | null>>({});
const datasetNames = computed(() => new Set(datasetList.value.map((dataset) => dataset.name)));
const datasetLaneOrderNames = ref<string[]>([]);

const availableDatasetList = computed(() => props.availableDatasets ?? []);

const showScenarioAdvancedSettings = ref(true);

const modelCardRefs = new Map<string, HTMLElement>();
const datasetCardRefs = new Map<string, HTMLElement>();

const referenceTimeInput = ref("");
const selectedModelName = ref<string | null>(null);

const editingModelIndex = ref<number | null>(null);
const editingDatasetIndex = ref<number | null>(null);

const isModelModalActive = ref(false);
const isDatasetModalActive = ref(false);

let refreshFrame: number | null = null;

const datasetList = computed(() => props.modelValue.datasets ?? []);
const modelLaneList = computed(() =>
  modelLaneNames.value
    .map((modelName) => modelList.value.find((model) => model.name === modelName))
    .filter((model): model is ScenarioModel => Boolean(model)),
);

const modelLaneDatasetNames = computed(() => {
  return new Set(Object.values(modelDatasetMap.value).flat());
});

const modelDatasetMap = computed<Record<string, string[]>>(() =>
  Object.fromEntries(
    modelLaneList.value.map((model) => [
      model.name,
      extractDatasetReferences(model, datasetNames.value),
    ]),
  ),
);

const connectedDatasetNames = computed(() => {
  if (selectedModelName.value) {
    return new Set(modelDatasetMap.value[selectedModelName.value] ?? []);
  }

  return modelLaneDatasetNames.value;
});

function extractDatasetReferences(model: ScenarioModel, availableDatasetNames: Set<string>) {
  const result = new Set<string>();
  const schema = modelSchemas[model.type];
  if (!schema) return [];

  transformDatasetReferences(model, schema, (datasetName) => {
    if (availableDatasetNames.has(datasetName)) result.add(datasetName);
    return datasetName;
  });

  return Array.from(result);
}

function dropDatasetIntoLane(event: DragEvent) {
  const datasetName = event.dataTransfer?.getData("application/x-movici-assistant-dataset");
  const dataset =
    datasetList.value.find((entry) => entry.name === datasetName) ??
    availableDatasetList.value.find((entry) => entry.name === datasetName);
  if (!dataset) return;

  if (!datasetList.value.some((entry) => entry.uuid === dataset.uuid)) {
    updateScenario((scenario) => {
      scenario.datasets.push({
        name: dataset.name,
        uuid: dataset.uuid,
        type: dataset.type,
      });
    });
  }

  insertUnique(datasetLaneOrderNames.value, dataset.name, datasetLaneOrderNames.value.length);

  requestConnectionsRefresh();
}

const modeOptionValue = computed(
  () => props.modelValue.simulation_info.mode ?? SimulationMode.TIME_ORIENTED,
);

const datasetLaneNameSet = computed(
  () =>
    new Set([...datasetList.value.map((dataset) => dataset.name), ...modelLaneDatasetNames.value]),
);

function changeDatasetLane(event: DraggableChangeEvent<ScenarioDataset>) {
  if (event.added) {
    insertUnique(datasetLaneOrderNames.value, event.added.element.name, event.added.newIndex);
    requestConnectionsRefresh();
    return;
  }

  if (event.moved) {
    datasetLaneOrderNames.value = move(
      event.moved.oldIndex,
      event.moved.newIndex,
      datasetLaneNames.value,
    );
  }

  requestConnectionsRefresh();
}

const datasetLaneNames = computed(() => {
  const laneNames = datasetLaneNameSet.value;
  const orderedNames = datasetLaneOrderNames.value.filter((name) => laneNames.has(name));
  const missingNames = datasetList.value
    .map((dataset) => dataset.name)
    .filter((name) => laneNames.has(name) && !orderedNames.includes(name));

  return [...orderedNames, ...missingNames];
});

const datasetLaneList = computed(() =>
  datasetLaneNames.value
    .map((datasetName) => datasetList.value.find((dataset) => dataset.name === datasetName))
    .filter((dataset): dataset is ScenarioDataset => Boolean(dataset)),
);

const modelTypeOptions = computed<ModelTypeOption[]>(() =>
  MODEL_SCHEMA_TYPES.map((value) => ({
    value,
    label: snakeToFriendly(value),
  })),
);

const simulationModeOptions = computed(() => [
  {
    value: SimulationMode.TIME_ORIENTED,
    label: t("flow.configurationAssistant.scenarioSettings.modeOptions.timeOriented"),
  },
  {
    value: SimulationMode.EVENT_ORIENTED,
    label: t("flow.configurationAssistant.scenarioSettings.modeOptions.eventOriented"),
  },
]);

const editingModel = computed<ScenarioModel | null>(() => {
  if (editingModelIndex.value == null) return null;
  return modelList.value[editingModelIndex.value] ?? null;
});

const editingDataset = computed<ScenarioDataset | null>(() => {
  if (editingDatasetIndex.value == null) return null;
  return datasetList.value[editingDatasetIndex.value] ?? null;
});

function openCreateModelModal() {
  editingModelIndex.value = null;
  isModelModalActive.value = true;
}

function openCreateDatasetModal() {
  editingDatasetIndex.value = null;
  isDatasetModalActive.value = true;
}

function openEditModelModal(modelName: string) {
  const modelIndex = modelList.value.findIndex((model) => model.name === modelName);
  if (modelIndex < 0) return;

  editingModelIndex.value = modelIndex;
  selectedModelName.value = modelList.value[modelIndex]?.name ?? null;
  isModelModalActive.value = true;
}

function openEditDatasetModal(datasetName: string) {
  const datasetIndex = datasetList.value.findIndex((dataset) => dataset.name === datasetName);
  if (datasetIndex < 0) return;

  editingDatasetIndex.value = datasetIndex;
  isDatasetModalActive.value = true;
}

function saveModel(model: ScenarioModel) {
  const previousModelName = editingModel.value?.name ?? null;

  updateScenario((scenario) => {
    scenario.models ??= [];

    if (editingModelIndex.value == null) {
      scenario.models.push(model);
    } else {
      scenario.models.splice(editingModelIndex.value, 1, model);
    }
  });

  if (!previousModelName) {
    insertUnique(modelLaneNames.value, model.name);
  } else {
    modelLaneNames.value = modelLaneNames.value.map((name) =>
      name === previousModelName ? model.name : name,
    );
  }

  selectedModelName.value = model.name;
  isModelModalActive.value = false;
  editingModelIndex.value = null;

  refreshConnections();
}

function deleteModel(modelName: string) {
  const modelIndex = modelList.value.findIndex((model) => model.name === modelName);
  if (modelIndex < 0) return;

  updateScenario((scenario) => {
    scenario.models?.splice(modelIndex, 1);
  });

  modelLaneNames.value = modelLaneNames.value.filter((name) => name !== modelName);
  modelCardRefs.delete(modelName);

  if (selectedModelName.value === modelName) {
    selectedModelName.value = modelLaneNames.value[0] ?? null;
  }

  if (editingModel.value?.name === modelName) {
    isModelModalActive.value = false;
    editingModelIndex.value = null;
  }

  requestConnectionsRefresh();
}

function deleteDataset(datasetName: string) {
  const datasetIndex = datasetList.value.findIndex((dataset) => dataset.name === datasetName);
  if (datasetIndex < 0) return;

  updateScenario((scenario) => {
    scenario.datasets.splice(datasetIndex, 1);
    replaceScenarioDatasetReferences(scenario, datasetName, "");
  });
}

function replaceScenarioDatasetReferences(
  scenario: Scenario,
  previousName: string,
  nextName: string,
) {
  scenario.models?.forEach((model) => {
    const schema = modelSchemas[model.type];
    if (!schema) return;

    transformDatasetReferences(model, schema, (datasetName) =>
      datasetName === previousName ? nextName : datasetName,
    );
  });

  if (
    scenario.simulation_info.mode === SimulationMode.EVENT_ORIENTED &&
    scenario.simulation_info.events_dataset === previousName
  ) {
    scenario.simulation_info.events_dataset = nextName;
  }
}

function saveDataset(dataset: ScenarioDataset) {
  const previousDatasetName = editingDataset.value?.name ?? null;

  updateScenario((scenario) => {
    if (editingDatasetIndex.value == null) {
      scenario.datasets.push(dataset);
    } else {
      scenario.datasets.splice(editingDatasetIndex.value, 1, dataset);
    }

    if (previousDatasetName && previousDatasetName !== dataset.name) {
      replaceScenarioDatasetReferences(scenario, previousDatasetName, dataset.name);
    }
  });

  if (previousDatasetName && previousDatasetName !== dataset.name) {
    datasetLaneOrderNames.value = datasetLaneOrderNames.value.map((name) =>
      name === previousDatasetName ? dataset.name : name,
    );

    datasetSummaries.value = renameRecordKey(
      datasetSummaries.value,
      previousDatasetName,
      dataset.name,
    );
  } else if (!previousDatasetName) {
    insertUnique(datasetLaneOrderNames.value, dataset.name);
  }

  isDatasetModalActive.value = false;
  editingDatasetIndex.value = null;

  requestConnectionsRefresh();
}

function renameRecordKey<T>(record: Record<string, T>, previousName: string, nextName: string) {
  if (!(previousName in record)) return record;

  const nextRecord = { ...record };
  nextRecord[nextName] = nextRecord[previousName]!;
  delete nextRecord[previousName];
  return nextRecord;
}

function updateScenario(mutator: (scenario: Scenario) => void) {
  const nextScenario = cloneDeep(props.modelValue);
  mutator(nextScenario);
  emit("update:modelValue", nextScenario);
}

function updateScenarioText(field: ScenarioTextField, value: string) {
  updateScenario((scenario) => {
    scenario[field] = value;
  });
}

function updateSimulationMode(value: string) {
  const nextMode =
    value === SimulationMode.EVENT_ORIENTED
      ? SimulationMode.EVENT_ORIENTED
      : SimulationMode.TIME_ORIENTED;

  updateScenario((scenario) => {
    scenario.simulation_info.mode = nextMode;

    if (nextMode === SimulationMode.TIME_ORIENTED) {
      getTimeInfo(scenario);
    }
  });
}

function updateEPSGCode(value: string | number) {
  const parsedValue = parseNumber(value);
  updateScenario((scenario) => {
    scenario.epsg_code = parsedValue == null ? undefined : Math.round(parsedValue);
  });
}

function updateReferenceTime(value: string) {
  referenceTimeInput.value = value;
  const parsedValue = parseDatetimeLocal(value);
  if (parsedValue == null) return;

  updateScenario((scenario) => {
    const info = getTimeInfo(scenario);
    info.reference_time = parsedValue;
  });
}

function updateTimeScaleValue(value: string | number) {
  const parsedValue = parseNumber(value);
  if (parsedValue == null) return;

  timeScaleForm.value = {
    ...timeScaleForm.value,
    value: parsedValue,
  };

  applyTimeSettings();
}

function updateTimeScaleUnit(value: string) {
  timeScaleForm.value = {
    ...timeScaleForm.value,
    unit: value as TimeUnitValue,
  };
  applyTimeSettings();
}

function updateDurationValue(value: string | number) {
  const parsedValue = parseNumber(value);
  if (parsedValue == null) return;

  durationForm.value = {
    ...durationForm.value,
    value: parsedValue,
  };
  applyDurationSettings();
}

function updateDurationUnit(value: string) {
  durationForm.value = {
    ...durationForm.value,
    unit: value as TimeUnitValue,
  };
  applyDurationSettings();
}

function formatDatetimeLocal(value?: number | null) {
  if (value == null) return "";

  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function parseDatetimeLocal(value?: string | null) {
  if (!value) return null;
  const timestamp = new Date(`${value}Z`).getTime();

  if (Number.isNaN(timestamp)) return null;
  return Math.round(timestamp / 1000);
}

function parseNumber(value: string | number) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function applyTimeSettings() {
  const previousInfo = getTimeInfo(props.modelValue);
  const actualDurationSeconds = Math.max(
    previousInfo.time_scale,
    previousInfo.duration * previousInfo.time_scale,
  );
  const newTimeScale = unitToSeconds(timeScaleForm.value.value, timeScaleForm.value.unit);

  updateScenario((scenario) => {
    const info = getTimeInfo(scenario);
    info.time_scale = Math.max(1, Math.round(newTimeScale));
    info.duration = Math.max(1, Math.round(actualDurationSeconds / info.time_scale));
  });
}

function applyDurationSettings() {
  const actualDurationSeconds = unitToSeconds(durationForm.value.value, durationForm.value.unit);

  updateScenario((scenario) => {
    const info = getTimeInfo(scenario);
    info.duration = Math.max(1, Math.round(actualDurationSeconds / Math.max(info.time_scale, 1)));
  });
}

function getTimeInfo(scenario: Scenario) {
  const simulationInfo = scenario.simulation_info as Partial<TimeOrientedSimulationInfo> &
    Record<string, unknown>;

  if (typeof simulationInfo.start_time !== "number") simulationInfo.start_time = 0;
  if (typeof simulationInfo.reference_time !== "number") simulationInfo.reference_time = 0;
  if (typeof simulationInfo.time_scale !== "number") simulationInfo.time_scale = 1;
  if (typeof simulationInfo.duration !== "number") simulationInfo.duration = 1;

  return simulationInfo as TimeOrientedSimulationInfo;
}

function insertUnique<T>(items: T[], item: T, index = items.length) {
  if (!items.includes(item)) {
    items.splice(index, 0, item);
  }
}

function secondsToNearestTimeUnit(totalSeconds: number, fallbackUnit: TimeUnitValue) {
  for (const unit of [...timeUnits].reverse()) {
    if (totalSeconds >= unit.seconds && Number.isInteger(totalSeconds / unit.seconds)) {
      return {
        value: totalSeconds / unit.seconds,
        unit: unit.value,
      };
    }
  }

  return {
    value: Number((totalSeconds / getUnit(fallbackUnit).seconds).toFixed(2)),
    unit: fallbackUnit,
  };
}

function unitToSeconds(value: number, unit: TimeUnitValue) {
  return value * getUnit(unit).seconds;
}

function getUnit(unit: TimeUnitValue) {
  return timeUnits.find((entry) => entry.value === unit) ?? defaultTimeUnit;
}

function dropModelIntoLane(event: DragEvent) {
  const modelName = event.dataTransfer?.getData("application/x-movici-assistant-model");
  const model = modelList.value.find((entry) => entry.name === modelName);
  if (!model) return;

  insertUnique(modelLaneNames.value, model.name);
  selectModel(model.name);
}

function changeModelLane(event: DraggableChangeEvent<ScenarioModel>) {
  if (event.added) {
    insertUnique(modelLaneNames.value, event.added.element.name, event.added.newIndex);
    selectModel(event.added.element.name);
    return;
  }

  if (event.moved) {
    modelLaneNames.value = move(event.moved.oldIndex, event.moved.newIndex, modelLaneNames.value);
  }

  requestConnectionsRefresh();
}

function selectModel(modelName: string) {
  selectedModelName.value = modelName;
  requestConnectionsRefresh();
}

function setCardRef(
  map: Map<string, HTMLElement>,
  key: string,
  element: Element | ComponentPublicInstance | null,
) {
  if (!(element instanceof HTMLElement)) {
    map.delete(key);
    return;
  }

  map.set(key, element);
}

function formatModelType(value?: string | null): string {
  const modelTypeFromOptions = modelTypeOptions.value.find((option) => option.value === value);
  return modelTypeFromOptions?.label ?? snakeToFriendly(value);
}

function requestConnectionsRefresh() {
  if (typeof window === "undefined" || refreshFrame !== null) return;

  refreshFrame = window.requestAnimationFrame(() => {
    refreshFrame = null;
    void refreshConnections();
  });
}

async function refreshConnections() {
  await nextTick();

  const canvas = canvasRef.value;
  if (!canvas) {
    modelDatasetConnections.value = [];
    return;
  }

  const boardRect = canvas.getBoundingClientRect();
  canvasSize.value = { width: boardRect.width, height: boardRect.height };

  const connections: ModelDatasetConnection[] = [];
  for (const model of modelLaneList.value) {
    const modelElement = modelCardRefs.get(model.name);
    if (!modelElement) continue;

    const modelRect = modelElement.getBoundingClientRect();
    const datasetNamesForModel = modelDatasetMap.value[model.name] ?? [];
    for (const datasetName of datasetNamesForModel) {
      const datasetElement = datasetCardRefs.get(datasetName);
      if (!datasetElement) continue;

      const datasetRect = datasetElement.getBoundingClientRect();
      const start = {
        x: modelRect.right - boardRect.left + CONNECTION_MARKER_GAP,
        y: modelRect.top - boardRect.top + modelRect.height / 2,
      };
      const end = {
        x: datasetRect.left - boardRect.left - CONNECTION_MARKER_GAP,
        y: datasetRect.top - boardRect.top + datasetRect.height / 2,
      };
      const controlOffset = Math.max(40, (end.x - start.x) / 2);

      connections.push({
        id: `${model.name}:${datasetName}`,
        modelName: model.name,
        start,
        end,
        path: `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`,
        active: !selectedModelName.value || selectedModelName.value === model.name,
      });
    }
  }

  modelDatasetConnections.value = connections;
}

function syncScenarioControls() {
  const info = getTimeInfo(props.modelValue);

  timeScaleForm.value = secondsToNearestTimeUnit(info.time_scale, "seconds");
  durationForm.value = secondsToNearestTimeUnit(
    Math.max(info.time_scale, info.duration * info.time_scale),
    "minutes",
  );
  referenceTimeInput.value = formatDatetimeLocal(info.reference_time);
}

async function fetchDatasetSummaries() {
  const summaries = await Promise.all(
    datasetList.value.map(async (dataset) => {
      try {
        const summary = await summaryStore.getSummary({
          datasetUUID: dataset.uuid,
          scenarioUUID: null,
        });
        return [dataset.name, summary] as const;
      } catch {
        return [dataset.name, null] as const;
      }
    }),
  );

  return Object.fromEntries(summaries);
}

watch(
  () => [
    props.modelValue.uuid,
    datasetList.value.map((dataset) => dataset.uuid).join("|"),
    modelList.value.map((model) => model.name).join("|"),
  ],
  async (_, __, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    const summaries = await fetchDatasetSummaries();
    if (cancelled) return;

    datasetSummaries.value = summaries;
    syncScenarioControls();
    requestConnectionsRefresh();
  },
  { immediate: true },
);

watch(
  () => props.modelValue.uuid,
  () => {
    modelLaneNames.value = (props.modelValue.models ?? []).map((model) => model.name);
  },
  { immediate: true },
);

watch(
  () => modelList.value.map((model) => model.name).join("|"),
  () => {
    const availableModelNames = new Set(modelList.value.map((model) => model.name));
    modelLaneNames.value = modelLaneNames.value.filter((name) => availableModelNames.has(name));
  },
);

onBeforeUnmount(() => {
  if (refreshFrame !== null) {
    window.cancelAnimationFrame(refreshFrame);
    refreshFrame = null;
  }
});
</script>

<style scoped lang="scss">
.configuration-assistant {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 1rem;
  background: $white;
  overflow-x: auto;
  overflow-y: hidden;

  :deep(.input),
  :deep(.textarea),
  :deep(.select select) {
    border-color: $grey-lightest;
    background: $white;
    color: $black-ter;
    box-shadow: none;
    transition: border-color 0.2s ease;
  }

  :deep(.input:hover),
  :deep(.textarea:hover),
  :deep(.select select:hover) {
    border-color: $grey-light;
  }

  :deep(.textarea) {
    min-height: 5rem;
    resize: vertical;
  }

  :deep(.select:not(.is-multiple):not(.is-loading)::after) {
    border-color: $green;
  }

  :deep(.icon svg) {
    color: currentColor;
  }
}

.configuration-assistant-grid {
  position: relative;
  display: grid;
  gap: 0.75rem;
  flex: 1;
  height: 100%;
  min-width: 1040px;
  min-height: 0;
  align-items: stretch;
  align-content: stretch;
  grid-auto-rows: minmax(0, 1fr);
  grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);

  &.three-columns {
    grid-template-columns: minmax(260px, 0.85fr) minmax(320px, 1fr) minmax(420px, 1.35fr);
  }
}

.configuration-assistant-connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;

  path {
    fill: none;
    stroke: $green;
    stroke-width: 1.5px;
  }

  circle {
    fill: $green;
  }

  .active {
    path {
      stroke: $green;
    }

    circle {
      fill: $green;
    }
  }

  .inactive {
    opacity: 0.2;
  }
}

.configuration-assistant-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid $grey-lighter;
  border-radius: 0.25rem;
  background: $white;
  overflow: hidden;
}

.configuration-assistant-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 4rem;
  padding: 0.75rem 1rem;
  background: $white;
  border-bottom: 1px solid $grey-lightest;

  h2 {
    margin: 0;
    color: $black-bis;
    font-size: 1rem;
    font-weight: 600;
  }

  .count {
    color: $grey-dark;
    font-weight: 400;
  }
}

.configuration-panel-add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid $green;
  border-radius: 0.25rem;
  background: $white;
  color: $green;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: $green-light;
  }
}

.config-assistant-panel__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0.75rem;
}

.config-assistant-panel__body--details {
  padding: 1rem;
}

.config-assistant-list {
  display: grid;
  gap: 0.75rem;
}

.config-assistant-card {
  position: relative;
  min-height: 0;
  padding: 0.75rem;
  border: 1px solid $grey-lightest;
  border-radius: 0.25rem;
  background: $white;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
  cursor: pointer;

  &:hover {
    background: $white-ter;
    border-color: $grey-light;
  }

  &.is-selected {
    padding-left: calc(0.75rem - 3px);
    border-left: 4px solid $green;
    background: $green-light;
  }

  &.is-linked {
    border-color: rgba($green, 0.35);
  }
}

.config-assistant-card__row {
  display: flex;
  align-items: center;
  gap: 0.42rem;
}

.config-assistant-card__drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 1.25rem;
  margin-left: -0.3rem;
  color: $grey;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.config-assistant-card__title {
  flex: 1;
  min-width: 0;
  color: $black-bis;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-assistant-card__subtitle {
  margin: 0.125rem 0 0 1.375rem;
  color: $grey-dark;
  font-size: 0.75rem;
  line-height: 1.25;
}

.config-assistant-card__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: $grey-dark;
  padding: 0.1rem;
  width: 1.55rem;
  height: 1.55rem;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: $green;
  }

  &:last-child:hover {
    color: $danger;
  }
}

.configuration-assistant-empty-state {
  display: grid;
  gap: 0.75rem;
  place-items: start;
  min-height: 180px;
  align-content: center;
  padding: 1rem;
  border: 1px dashed $grey-lighter;
  border-radius: 0.25rem;
  background: $white-ter;
  color: $grey-dark;
}

.scenario-form {
  display: grid;
  gap: 0.75rem;
}

.config-assistant-panel__body--details > .scenario-form {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.scenario-form__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.25rem;

  label {
    color: $black-bis;
    font-size: 0.875rem;
    font-weight: 600;
  }
}

.scenario-advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: $black-bis;
  font-size: 0.875rem;
  font-weight: 400;
  cursor: pointer;

  &:hover {
    color: $green;
  }
}

.compound-field {
  display: grid;
  grid-template-columns: minmax(0, 100px) minmax(0, 1fr);
  gap: 0.45rem;
}
</style>
