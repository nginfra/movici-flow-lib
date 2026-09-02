<template>
  <div class="schema-field">
    <o-field
      v-if="isObjectField"
      class="schema-field__section"
      :class="{ 'schema-field__section--unlabeled': !label }"
    >
      <template v-if="label" #label>
        {{ label }}<span v-if="required" class="schema-field__required" aria-hidden="true">*</span>
      </template>
      <div class="schema-field__section-body">
        <SchemaModelField
          v-for="child in objectFields"
          :key="child.key"
          :field-key="child.key"
          :schema="child.schema"
          :root-schema="rootSchema"
          :model-value="objectValue[child.key]"
          :root-value="rootValue"
          :parent-value="objectValue"
          :scenario-datasets="scenarioDatasets"
          :dataset-summaries="datasetSummaries"
          :required="child.required"
          @update:modelValue="updateObjectField(child.key, $event)"
        />
      </div>
    </o-field>

    <o-field
      v-else-if="isArrayField"
      class="schema-field__section"
      :class="{ 'schema-field__section--unlabeled': !label }"
    >
      <template v-if="label" #label>
        {{ label }}<span v-if="required" class="schema-field__required" aria-hidden="true">*</span>
      </template>
      <div class="schema-field__section-body">
        <div v-for="(entry, index) in arrayValue" :key="index">
          <header class="is-flex is-align-items-center">
            <span class="label mb-0 is-flex-grow-1"> {{ label }} {{ index + 1 }} </span>

            <o-button
              v-if="!isTupleField"
              class="is-transparent has-hover-bg is-borderless has-text-danger"
              icon-pack="far"
              icon-left="trash"
              size="small"
              :title="t('actions.delete')"
              @click="removeArrayEntry(index)"
            />
          </header>

          <SchemaModelField
            field-key=""
            :schema="getArrayItemSchema(index)"
            :root-schema="rootSchema"
            :model-value="entry"
            :root-value="rootValue"
            :parent-value="entry"
            :scenario-datasets="scenarioDatasets"
            :dataset-summaries="datasetSummaries"
            @update:modelValue="updateArrayEntry(index, $event)"
          />
        </div>

        <o-button
          v-if="!isTupleField"
          class="schema-field__add-button is-size-7 is-transparent has-hover-bg is-borderless has-text-primary has-text-weight-bold"
          icon-pack="far"
          icon-left="plus-circle"
          size="small"
          @click="addArrayEntry"
        >
          {{ t("actions.addNew") }}
        </o-button>
      </div>
    </o-field>

    <o-field
      v-else-if="isAttributeMapField"
      class="schema-field__section"
      :class="{ 'schema-field__section--unlabeled': !label }"
    >
      <template v-if="label" #label>
        {{ label }}<span v-if="required" class="schema-field__required" aria-hidden="true">*</span>
      </template>
      <div class="schema-field__section-body">
        <div v-for="(entry, index) in mapRows" :key="index">
          <o-input
            size="small"
            :modelValue="entry.key"
            @update:modelValue="updateMapRow(index, 'key', $event)"
          />
          <AttributeInput
            :model-value="entry.value"
            :options="attributeOptions"
            :disabled="!entry.key"
            @update:modelValue="updateMapRow(index, 'value', $event)"
          />
          <button type="button" @click="removeMapRow(index)">
            <o-icon pack="far" icon="trash-alt" size="small" />
          </button>
        </div>
        <button type="button" :disabled="hasEmptyMapRow" @click="addMapRow">
          {{ t("flow.configurationAssistant.addInput") }}
        </button>
      </div>
    </o-field>

    <o-field
      v-else
      class="schema-field__section"
      :class="{ 'schema-field__section--unlabeled': !label }"
    >
      <template v-if="label" #label>
        {{ label }}<span v-if="required" class="schema-field__required" aria-hidden="true">*</span>
      </template>
      <div v-if="isEntityGroupField" class="schema-field__pair">
        <o-select
          size="small"
          expanded
          :modelValue="entityGroupDataset"
          @update:modelValue="updateEntityGroupDataset"
        >
          <option v-for="dataset in filteredDatasets" :key="dataset.uuid" :value="dataset.name">
            {{ dataset.name }}
          </option>
        </o-select>
        <o-select
          size="small"
          expanded
          :disabled="!entityGroupOptions.length"
          :modelValue="entityGroupName"
          @update:modelValue="updateEntityGroupName"
        >
          <option v-for="group in entityGroupOptions" :key="group.name" :value="group.name">
            {{ group.name }}
          </option>
        </o-select>
      </div>

      <o-select
        v-else-if="isDatasetField"
        size="small"
        expanded
        :modelValue="stringValue"
        @update:modelValue="emitString"
      >
        <option value=""></option>
        <option v-for="dataset in filteredDatasets" :key="dataset.uuid" :value="dataset.name">
          {{ dataset.name }}
        </option>
      </o-select>

      <AttributeInput
        v-else-if="isAttributeField"
        :model-value="stringValue"
        :options="attributeOptions"
        @update:modelValue="emitString"
      />

      <o-select
        v-else-if="enumOptions.length"
        size="small"
        expanded
        :modelValue="stringValue"
        @update:modelValue="emitString"
      >
        <option v-if="!required" value=""></option>
        <option v-for="option in enumOptions" :key="option" :value="option">
          {{ snakeToFriendly(option) }}
        </option>
      </o-select>

      <o-checkbox
        v-else-if="isBooleanField"
        size="small"
        :modelValue="Boolean(modelValue)"
        @update:modelValue="emit('update:modelValue', $event)"
      />

      <o-input
        v-else-if="isNumberField"
        size="small"
        type="number"
        :modelValue="modelValue == null ? '' : String(modelValue)"
        @update:modelValue="emitNumber"
      />

      <o-input v-else size="small" :modelValue="stringValue" @update:modelValue="emitString" />
    </o-field>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, resolveComponent } from "vue";
import {
  getSchemaKind,
  getSchemaProperties,
  isEntityGroupSchema,
  isJsonSchemaObject,
  isType,
  normalizeSchema,
  resolveSchema,
  resolveSchemaForValue,
  schemaDefaultValue,
} from "./schemaUtils";
import type { JsonSchema } from "./modelSchemas";
import { snakeToFriendly } from "@movici-flow-lib/utils/filters";
import type { DatasetSummary, ScenarioDataset } from "@movici-flow-lib/types";
import { useI18n } from "vue-i18n";

type MapRow = { key: string; value: string };
type EntityGroup = [dataset: string, group: string];

const props = defineProps<{
  fieldKey: string;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  modelValue: unknown;
  rootValue: Record<string, unknown>;
  parentValue: unknown;
  scenarioDatasets: ScenarioDataset[];
  datasetSummaries: Record<string, DatasetSummary | null>;
  required?: boolean;
}>();

const { t } = useI18n();

const emit = defineEmits<{
  (e: "update:modelValue", value: unknown): void;
}>();

const AttributeInput = defineComponent({
  props: {
    modelValue: { type: String, default: "" },
    options: { type: Array as () => { name: string }[], default: () => [] },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  setup(inputProps, { emit: inputEmit }) {
    const OInput = resolveComponent("o-input");
    const OSelect = resolveComponent("o-select");

    return () =>
      inputProps.options.length
        ? h(
            OSelect,
            {
              size: "small",
              expanded: true,
              disabled: inputProps.disabled,
              modelValue: inputProps.modelValue,
              "onUpdate:modelValue": (value: string) => inputEmit("update:modelValue", value),
            },
            {
              default: () => [
                h("option", { value: "" }),
                ...inputProps.options.map((option) =>
                  h("option", { key: option.name, value: option.name }, option.name),
                ),
              ],
            },
          )
        : h(OInput, {
            size: "small",
            disabled: inputProps.disabled,
            modelValue: inputProps.modelValue,
            "onUpdate:modelValue": (value: string) => inputEmit("update:modelValue", value),
          });
  },
});

const label = computed(() => (props.fieldKey ? snakeToFriendly(props.fieldKey) : ""));
const enumOptions = computed(() => effectiveSchema.value.enum ?? []);

const effectiveSchema = computed(() =>
  resolveSchemaForValue(props.schema, props.rootSchema, props.modelValue),
);
const schemaKind = computed(() => getSchemaKind(effectiveSchema.value, props.rootSchema));

const stringValue = computed(() => (props.modelValue == null ? "" : String(props.modelValue)));
const objectValue = computed<Record<string, unknown>>(() =>
  isJsonSchemaObject(props.modelValue) ? props.modelValue : {},
);
const arrayValue = computed<unknown[]>(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [],
);
const mapRows = computed(() =>
  Object.entries(objectValue.value).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
  })),
);
const objectFields = computed(() => {
  const requiredFields = new Set(effectiveSchema.value.required ?? []);
  return getSchemaProperties(effectiveSchema.value).map(([key, schema]) => ({
    key,
    schema,
    required: requiredFields.has(key),
  }));
});

const hasEmptyMapRow = computed(() => mapRows.value.some((row) => !row.key));
const isDatasetField = computed(() => effectiveSchema.value["movici.type"] === "dataset");
const isAttributeField = computed(() => effectiveSchema.value["movici.type"] === "attribute");
const isNumberField = computed(
  () =>
    isType(effectiveSchema.value.type, "number") || isType(effectiveSchema.value.type, "integer"),
);
const isObjectField = computed(
  () => schemaKind.value === "object" && Boolean(effectiveSchema.value.properties),
);
const isArrayField = computed(() => schemaKind.value === "array");
const isTupleField = computed(() => Array.isArray(effectiveSchema.value.items));
const isEntityGroupField = computed(() =>
  isEntityGroupSchema(effectiveSchema.value, props.rootSchema),
);
const isAttributeMapField = computed(() => {
  const additionalProperties = effectiveSchema.value.additionalProperties;

  return (
    isJsonSchemaObject(additionalProperties) &&
    resolveSchema(additionalProperties, props.rootSchema)["movici.type"] === "attribute"
  );
});
const isBooleanField = computed(() => {
  return Array.isArray(effectiveSchema.value)
    ? effectiveSchema.value.includes("boolean")
    : effectiveSchema.value.type === "boolean";
});

const filteredDatasets = computed(() => {
  const datasetType = effectiveSchema.value["movici.datasetType"] ?? datasetTypeFromEntityGroup();
  if (!datasetType) return props.scenarioDatasets;
  return props.scenarioDatasets.filter((dataset) => dataset.type === datasetType);
});

const entityGroupDataset = computed(() =>
  isEntityGroup(props.modelValue) ? props.modelValue[0] : "",
);

const entityGroupName = computed(() =>
  isEntityGroup(props.modelValue) ? props.modelValue[1] : "",
);

const entityGroupOptions = computed(
  () => props.datasetSummaries[entityGroupDataset.value]?.entity_groups ?? [],
);

const attributeOptions = computed(() => {
  const entityGroup = attributeEntityGroup();

  if (!entityGroup) {
    return Object.values(props.datasetSummaries)
      .flatMap((summary) => summary?.entity_groups ?? [])
      .flatMap((group) => group.properties);
  }

  const [datasetName, entityGroupName] = entityGroup;
  const summary = props.datasetSummaries[datasetName];

  return summary?.entity_groups.find((group) => group.name === entityGroupName)?.properties ?? [];
});

function isEntityGroup(value: unknown): value is EntityGroup {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "string" &&
    typeof value[1] === "string"
  );
}

function getArrayItemSchema(index: number) {
  const items = effectiveSchema.value.items;
  return normalizeSchema(
    resolveSchema(Array.isArray(items) ? (items[index] ?? {}) : (items ?? {}), props.rootSchema),
    props.rootSchema,
  );
}

function datasetTypeFromEntityGroup() {
  if (!isEntityGroupField.value) return undefined;
  const datasetSchema = Array.isArray(effectiveSchema.value.items)
    ? effectiveSchema.value.items[0]
    : undefined;
  return datasetSchema?.["movici.datasetType"];
}

function attributeEntityGroup(): EntityGroup | null {
  const direction = props.fieldKey.includes("target") ? "target" : "source";
  const parent = isJsonSchemaObject(props.parentValue) ? props.parentValue : null;

  return (
    (parent && findEntityGroup(parent, direction)) ??
    findEntityGroup(props.rootValue, direction === "target" ? "target" : undefined)
  );
}

function findEntityGroup(value: Record<string, unknown>, prefix?: string): EntityGroup | null {
  for (const [key, entry] of Object.entries(value)) {
    const matchesKey = key.includes("entity_group") && (!prefix || key.includes(prefix));

    if (matchesKey && isEntityGroup(entry)) {
      return entry;
    }
  }

  return null;
}

function emitString(value: string) {
  const isNullable = Array.isArray(effectiveSchema.value.type)
    ? effectiveSchema.value.type.includes("null")
    : effectiveSchema.value.type === "null";

  if (!value && isNullable) {
    emit("update:modelValue", null);
    return;
  }

  emit("update:modelValue", value);
}

function emitNumber(value: string | number) {
  if (typeof value === "string" && !value.trim()) {
    const isNullable = isType(effectiveSchema.value.type, "null");
    emit("update:modelValue", isNullable ? null : undefined);
    return;
  }

  const parsedValue = typeof value === "number" ? value : Number(value);
  emit("update:modelValue", Number.isFinite(parsedValue) ? parsedValue : undefined);
}

function updateObjectField(key: string, value: unknown) {
  emit("update:modelValue", {
    ...objectValue.value,
    [key]: value,
  });
}

function updateEntityGroupDataset(datasetName: string) {
  const entityGroups = props.datasetSummaries[datasetName]?.entity_groups ?? [];
  const currentGroupName = entityGroupName.value;
  const nextGroupName = entityGroups.some((group) => group.name === currentGroupName)
    ? currentGroupName
    : (entityGroups[0]?.name ?? "");

  emit("update:modelValue", [datasetName, nextGroupName]);
}

function updateEntityGroupName(entityGroup: string) {
  emit("update:modelValue", [entityGroupDataset.value, entityGroup]);
}

function addArrayEntry() {
  emit("update:modelValue", [
    ...arrayValue.value,
    schemaDefaultValue(getArrayItemSchema(arrayValue.value.length), props.rootSchema),
  ]);
}

function updateArrayEntry(index: number, value: unknown) {
  const nextValue = [...arrayValue.value];
  nextValue[index] = value;
  emit("update:modelValue", nextValue);
}

function removeArrayEntry(index: number) {
  const nextValue = [...arrayValue.value];
  nextValue.splice(index, 1);
  emit("update:modelValue", nextValue);
}

function addMapRow() {
  if (hasEmptyMapRow.value) return;

  emit("update:modelValue", {
    ...objectValue.value,
    "": attributeOptions.value[0]?.name ?? "",
  });
}

function updateMapRow(index: number, field: keyof MapRow, value: string) {
  const rows = [...mapRows.value];
  if (
    field === "key" &&
    value &&
    rows.some((row, rowIndex) => rowIndex !== index && row.key === value)
  ) {
    return;
  }

  rows[index] = { ...rows[index]!, [field]: value };
  emit(
    "update:modelValue",
    Object.fromEntries(rows.filter((row) => row.key).map((row) => [row.key, row.value])),
  );
}

function removeMapRow(index: number) {
  const rows = [...mapRows.value];
  rows.splice(index, 1);
  emit("update:modelValue", Object.fromEntries(rows.map((row) => [row.key, row.value])));
}
</script>

<style scoped lang="scss">
.schema-field {
  display: grid;
  gap: 0.75rem;
}

.schema-field__section {
  display: grid;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.schema-field__section--unlabeled {
  gap: 0.95rem;
  padding-top: 0;
  border-top: 0;
}

.schema-field__required {
  margin-left: 2px;
  color: $grey;
  font-weight: bold;
}

.schema-field__section-body {
  display: grid;
  gap: 0.95rem;
}

.schema-field__pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
}

.schema-field__add-button {
  justify-self: start;
}
</style>
