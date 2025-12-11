<template>
  <div class="columns mb-0 is-multiline">
    <div class="column is-two-thirds-desktop is-full-tablet">
      <o-field
        :label="t('flow.visualization.geometryConfig.geometryLabel')"
        required
        :message="errors['local']"
        :variant="errors['local'] && 'danger'"
      >
        <template #label>
          {{ t("flow.visualization.geometryConfig.geometryLabel") }}
          <o-icon
            size="small"
            variant="info"
            icon-pack="far"
            icon="info-circle"
            :title="t('flow.visualization.geometryConfig.geometryInfo')"
          />
        </template>
        <span
          class="is-flex is-align-items-center"
          v-for="(val, key) in requiredAdditionalEntityGroups"
          :key="key"
        >
          <span class="mr-4 is-size-7 label"> {{ upperFirst(key) }}: </span>
          <MovFilteredSelect
            class="is-flex-grow-1 unset-width"
            :modelValue="local[key]"
            @update:modelValue="updateValue(key, $event)"
            :options="summary.entity_groups"
            :filterVal="filterVal(val)"
            :displayName="displayName"
          />
        </span>
      </o-field>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useValidator } from "@movici-flow-lib/composables/useValidator";
import type { EntityGroupSummary } from "@movici-flow-lib/types";
import { EntityGeometry, FlowVisualizerType } from "@movici-flow-lib/types";
import { upperFirst } from "@movici-flow-lib/utils/filters";
import { isGrid, isLines, isPoints, isPolygons } from "@movici-flow-lib/visualizers/geometry";
import { computed, inject, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { geometryInjection, summaryInjection, validatorInjection } from "./injectionKeys";
const { t } = useI18n();

const props = defineProps<{
  modelValue?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: Record<string, string>): void;
}>();

const geometry = inject(geometryInjection)!;
const summary = inject(summaryInjection)!;
const validator = inject(validatorInjection)!.child("geometry");
function fillLocal(val?: Record<string, string>) {
  local.value = {};
  if (!val) return;

  for (const [key, value] of Object.entries(val)) {
    if (requiredAdditionalEntityGroups.value[key]) {
      const entityGroup = getEntityGroup(value);
      if (entityGroup) {
        local.value[key] = entityGroup;
      }
    }
  }
}
function updateValue(key: string, val: EntityGroupSummary) {
  local.value = { ...local.value, ...{ [key]: val } };
  emit("update:modelValue", { ...props.modelValue, [key]: val.name });
}

const REQUIRED_ADDITIONAL_ENTITY_GROUPS: Partial<
  Record<FlowVisualizerType, Record<string, EntityGeometry>>
> = {
  [FlowVisualizerType.FLOODING_GRID]: { points: EntityGeometry.POINT },
  [FlowVisualizerType.GRID]: { points: EntityGeometry.POINT },
};

const FILTERS: Record<EntityGeometry, (val: EntityGroupSummary) => boolean> = {
  [EntityGeometry.POINT]: (val: EntityGroupSummary) => isPoints(val.properties),
  [EntityGeometry.LINE]: (val: EntityGroupSummary) => isLines(val.properties),
  [EntityGeometry.POLYGON]: (val: EntityGroupSummary) => isPolygons(val.properties),
  [EntityGeometry.GRID]: (val: EntityGroupSummary) => isGrid(val.properties),
};
const requiredAdditionalEntityGroups = computed<Record<string, EntityGeometry>>(
  () => (geometry.value ? REQUIRED_ADDITIONAL_ENTITY_GROUPS[geometry.value] : null) ?? {}
);
function getEntityGroup(name?: string) {
  if (!name || !summary.value) return;

  return summary.value.entity_groups.find((group) => group.name === name);
}

function filterVal(key: EntityGeometry): (val: EntityGroupSummary) => boolean {
  return FILTERS[key];
}

function displayName(val: EntityGroupSummary): string {
  return `${val.name} (${val.count})`;
}
validator.configure({
  validators: {
    local: () => {
      if (!local.value) return "Invalid clause";

      for (const key in requiredAdditionalEntityGroups.value) {
        if (!local.value[key]) return t("flow.visualization.geometryConfig.geometryError");
      }
    },
  },
});
const { errors, destroyValidator, validated } = useValidator(validator);
const local = validated("local", ref<Record<string, EntityGroupSummary>>({}));
onUnmounted(destroyValidator);
fillLocal(props.modelValue);
</script>

<style scoped lang="scss">
.unset-width {
  width: unset;
}
</style>
