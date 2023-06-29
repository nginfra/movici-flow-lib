<template>
  <div v-if="modelValue">
    <slot name="options-top" v-bind="{ mappingHelper }"></slot>
    <div class="columns mb-0 is-multiline">
      <div class="column is-full">
        <div class="is-flex">
          <o-field
            class="mr-4 is-flex-shrink-1"
            :label="$t('flow.visualization.byValueConfig.steps')"
          >
            <o-select
              :modelValue="modelValue.length"
              @update:modelValue="updateSteps"
              size="small"
              expanded
              :disabled="!isMode('number')"
            >
              <option v-for="nSteps in stepArray" :key="nSteps" :value="nSteps">
                {{ nSteps }}
              </option>
            </o-select>
          </o-field>
          <slot name="options-side" v-bind="{ mappingHelper }"></slot>
        </div>
      </div>
    </div>
    <div class="columns mb-0 is-multiline">
      <div class="column py-0 is-two-thirds-desktop is-full-tablet">
        <ByValueList
          :modelValue="modelValue"
          @update:modelValue="emitMapping($event)"
          :component="component"
          :componentProps="componentProps"
          :mappingHelper="mappingHelper"
          :maxValue="maxValue"
          @update:maxValue="setMaxValue"
          :label="label"
          reversed
          @resetValues="resetValues"
          @interpolateMinMax="interpolateMinMax"
          @add-row="addRow"
        >
          <template #after-output="{ output }">
            <slot name="after-output" v-bind="{ output, mappingHelper }"></slot>
          </template>
        </ByValueList>
      </div>
      <div class="column mt-1 py-0 is-one-third-desktop is-full-tablet">
        <slot name="legend-labels" v-bind="{ placeholders: legendPlaceHolders }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import type { AttributeSummary } from "@movici-flow-lib/types";
import { computed, inject, onMounted, shallowRef, watch } from "vue";
import ByValueList from "./ByValueList.vue";
import { MappingStrategy, createValueMappingHelper, type MappingMode } from "./ValueMappingHelper";
import { summaryInjection } from "./injectionKeys";

type PlaceholderType = "single" | "range";

function getLegendPlaceholders(
  items: number[],
  type: PlaceholderType,
  maxValue?: number | null
): string[] {
  if (!items.length) return [];
  return items.map((_, index) => getSingleLegendPlaceholder(items, type, index, maxValue));
}

function getSingleLegendPlaceholder(
  items: number[],
  type: PlaceholderType,
  index: number,
  maxValue?: number | null
): string {
  if (index > items.length - 1) {
    throw RangeError("index out of bounds");
  }
  let rv = `${items[index]}`;
  if (type === "range") {
    rv += " - " + (items[index + 1] ?? maxValue ?? "");
  }
  return rv;
}

const summary = inject(summaryInjection)!;

const props = defineProps<{
  modelValue?: [number, T][];
  selectedAttribute: AttributeSummary;
  strategy: MappingStrategy<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: any;
  componentProps?: Record<string, unknown>;
  label?: string;
  buckets?: boolean;
  maxValue?: number | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: [number, T][]): void;
  (e: "update:maxValue", val: number | null): void;
}>();

const enums = computed(() => summary.value.general?.enum);
const enumLabels = computed(() => enums.value?.[props.selectedAttribute?.enum_name ?? ""] ?? []);

const mappingHelper = shallowRef(
  createValueMappingHelper({
    summary: props.selectedAttribute,
    strategy: props.strategy,
    buckets: props.buckets,
    maxValue: props.maxValue,
    enums: enums.value,
  })
);

const stepArray = [2, 3, 4, 5, 6, 7, 8];

const legendPlaceHolders = computed(() => {
  if (isMode("enum")) {
    return enumLabels.value;
  }
  if (isMode("boolean")) {
    return ["no", "yes"];
  }
  return getLegendPlaceholders(
    props.modelValue?.map((v) => v[0]) ?? [],
    isMode("buckets") ? "range" : "single",
    props.maxValue
  );
});

function isMode(query: MappingMode) {
  return mappingHelper.value.modeFlags.includes(query);
}

function interpolateMinMax() {
  emitMapping(mappingHelper.value.linearizeValues(props.modelValue ?? []));
}

function updateSteps(nSteps: number) {
  emitMapping(mappingHelper.value.updateSteps(props.modelValue ?? [], nSteps));
}

function resetValues() {
  const result = mappingHelper.value.resetMinMax(props.modelValue ?? []);
  emit("update:maxValue", mappingHelper.value.getMaxValue());
  emitMapping(result);
}

function addRow() {
  emitMapping(mappingHelper.value.addRow(props.modelValue ?? []));
}

function emitMapping(mapping: [number, T][]) {
  emit("update:modelValue", mapping);
}

function setMaxValue(val: number | null) {
  mappingHelper.value.setMaxValue(val);
  emitMaxValueFromHelper();
}

function emitMaxValueFromHelper() {
  emit("update:maxValue", mappingHelper.value.getMaxValue());
}

watch(
  () => props.selectedAttribute,
  (summary: AttributeSummary) => {
    evolveMappingHelper({ summary, buckets: props.buckets }, { resetMinMax: true });
    emitMaxValueFromHelper();
  }
);

watch(
  () => props.strategy,
  (strategy: MappingStrategy<T>) => {
    evolveMappingHelper({ strategy });
  }
);

watch(enums, (enums) => {
  evolveMappingHelper({ enums });
});

watch(
  () => props.buckets,
  (buckets: boolean) => {
    const mapping = props.modelValue ?? [];
    const maxValue = mappingHelper.value.getMaxValue(mapping);

    // for unclear reasons we want to manually evolve the mapping helper and not use the
    // evolveMappingHelper function here. Maybe that's something to look into. If you do,
    // please update this comment with your findings
    mappingHelper.value = mappingHelper.value.evolve({ buckets });
    const newMapping = mappingHelper.value.initializeMapping(mapping, {
      overrideMax: maxValue,
    });
    emitMaxValueFromHelper();
    emitMapping(newMapping);
  }
);

watch(
  () => props.maxValue,
  () => {
    if (props.maxValue != null) {
      mappingHelper.value.setMaxValue(props.maxValue);
    }
  }
);

function evolveMappingHelper(
  evolveArgs: {
    summary?: AttributeSummary;
    strategy?: MappingStrategy<T>;
    enums?: Record<string, string[]>;
    buckets?: boolean;
  },
  initializeFlags?: {
    resetMinMax?: boolean;
  }
) {
  mappingHelper.value = mappingHelper.value.evolve(evolveArgs);
  emitMapping(mappingHelper.value.initializeMapping(props.modelValue ?? [], initializeFlags));
}

onMounted(() => {
  emitMapping(mappingHelper.value.initializeMapping(props.modelValue ?? []));
  emitMaxValueFromHelper();
});
</script>

<style scoped lang="scss"></style>
