<template>
  <MovModal
    :active="active"
    :title="modalTitle"
    :width="780"
    :can-cancel="['x', 'escape', 'outside']"
    @update:active="emit('update:active', $event)"
  >
    <template #content>
      <div class="model-modal">
        <o-field :label="t('model.name')">
          <o-input size="small" expanded v-model="modelForm.name" />
        </o-field>

        <o-field :label="t('model.selectType')">
          <o-select
            size="small"
            expanded
            :disabled="isEditingModel"
            :modelValue="modelForm.type"
            @update:modelValue="updateModelType"
          >
            <option v-for="option in modelTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </o-select>
        </o-field>

        <template v-if="activeSchema">
          <SchemaModelField
            v-for="field in jsonFormFields"
            :key="field.key"
            :field-key="field.key"
            :schema="field.schema"
            :root-schema="activeSchema"
            :model-value="modelForm.config[field.key]"
            :root-value="modelForm.config"
            :parent-value="modelForm.config"
            :scenario-datasets="scenarioDatasets"
            :dataset-summaries="datasetSummaries"
            :required="field.required"
            @update:modelValue="updateConfigField(field.key, $event)"
          />
        </template>
      </div>
    </template>

    <template #footer>
      <div class="model-modal__footer">
        <o-button size="small" @click="emit('update:active', false)">
          {{ t("actions.cancel") }}
        </o-button>
        <o-button size="small" variant="primary" :disabled="!canSave" @click="save">
          {{ t("actions.save") }}
        </o-button>
      </div>
    </template>
  </MovModal>
</template>

<script setup lang="ts">
import type { DatasetSummary, ScenarioDataset, ScenarioModel } from "@movici-flow-lib/types";
import { computed, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { modelSchemas, type JsonSchema } from "./modelSchemas";
import { getDefaultConfig, getSchemaProperties, isJsonSchemaObject } from "./schemaUtils.ts";
import type { ModelTypeOption, SchemaField } from "./types";
import SchemaModelField from "./SchemaModelField.vue";
import Ajv from "ajv";
import { cloneDeep } from "lodash";

const DEFAULT_MODEL_TYPE = "udf";

type ModelFormState = {
  name: string;
  type: string;
  config: Record<string, unknown>;
};

const props = defineProps<{
  active?: boolean;
  model?: ScenarioModel | null;
  scenarioDatasets: ScenarioDataset[];
  datasetSummaries: Record<string, DatasetSummary | null>;
  modelTypeOptions: ModelTypeOption[];
}>();

const emit = defineEmits<{
  (e: "update:active", val: boolean): void;
  (e: "save", model: ScenarioModel): void;
}>();

const { t } = useI18n();

const ajv = new Ajv({
  allErrors: true,
  addUsedSchema: false,
});

const modelForm = reactive<ModelFormState>({
  name: "",
  type: DEFAULT_MODEL_TYPE,
  config: getDefaultConfig(modelSchemas[DEFAULT_MODEL_TYPE]),
});

const modalTitle = computed(() => (props.model ? t("model.edit") : t("model.addNew")));
const isEditingModel = computed(() => props.model != null);
const activeSchema = computed(() => modelSchemas[modelForm.type] ?? null);

const jsonFormFields = computed<SchemaField[]>(() => {
  const schema = activeSchema.value;
  if (!schema) return [];

  const requiredFields = new Set(schema.required ?? []);
  return getSchemaProperties(schema).map(([key, fieldSchema]) => ({
    key,
    schema: fieldSchema,
    required: requiredFields.has(key),
  }));
});

const schemaValidator = computed(() => createSchemaValidator(activeSchema.value));
const schemaValidationErrors = computed(() => {
  const validator = schemaValidator.value;
  if (!validator || validator(modelForm.config)) return [];
  return validator.errors ?? [];
});

const canSave = computed(() => {
  if (!modelForm.name.trim() || !modelForm.type.trim()) return false;

  const schema = activeSchema.value;
  if (!schema) return false;

  return (
    !schemaValidationErrors.value.length &&
    jsonFormFields.value
      .filter((field) => field.required)
      .every((field) => hasRequiredValue(modelForm.config[field.key]))
  );
});

function save() {
  if (!canSave.value) return;

  const model = {
    name: modelForm.name.trim(),
    type: modelForm.type.trim(),
    ...pruneConfig(modelForm.config, activeSchema.value!),
  } as ScenarioModel;

  emit("save", model);
  emit("update:active", false);
}

function updateConfigField(key: string, value: unknown) {
  modelForm.config = {
    ...modelForm.config,
    [key]: value,
  };
}

function updateModelType(modelType: string) {
  modelForm.type = modelType;
  modelForm.config = getDefaultConfig(modelSchemas[modelType]);
}

function createSchemaValidator(schema: JsonSchema | null) {
  if (!schema) return undefined;
  return ajv.compile(schema);
}

function pruneConfig(config: Record<string, unknown>, schema: JsonSchema) {
  const result: Record<string, unknown> = {};

  for (const [key] of getSchemaProperties(schema)) {
    if (config[key] !== undefined) {
      result[key] = config[key];
    }
  }

  return result;
}

function configFromModel(model: ScenarioModel) {
  const config = cloneDeep(model) as Record<string, unknown>;
  delete config.name;
  delete config.type;
  return config;
}

function hasRequiredValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0 && value.every(hasRequiredValue);
  if (isJsonSchemaObject(value)) return Object.values(value).every(hasRequiredValue);
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
}

watch(
  () => [props.active, props.model],
  () => {
    if (!props.active) return;

    const type = props.model?.type ?? DEFAULT_MODEL_TYPE;
    const schema = modelSchemas[type];

    modelForm.name = props.model?.name ?? "";
    modelForm.type = type;
    modelForm.config = {
      ...getDefaultConfig(schema),
      ...(props.model ? configFromModel(props.model) : {}),
    };
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.modal {
  :deep(.modal-content) {
    width: calc(100vw - 2rem);
    margin-inline: 0;
  }

  :deep(.modal-card) {
    width: 100%;
    max-width: 100%;
    margin-inline: auto;
  }
}

.model-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
