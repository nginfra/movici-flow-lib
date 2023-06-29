<template>
  <div>
    <div class="columns mb-0 is-multiline" v-if="datasets">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <o-field
          :label="$t('flow.visualization.floodingConfig.heightMap')"
          required
          :message="errors['heightmap']"
          :variant="errors['heightmap'] && 'danger'"
        >
          <MovFilteredSelect
            class="is-flex-grow-1"
            v-model="localDataset"
            :options="datasets"
            :filterVal="datasetFilter"
            :displayName="displayName"
          />
        </o-field>
      </div>
      <div class="column is-one-third-desktop">
        <o-field>
          <o-checkbox v-model="showLegend" size="small">
            {{ $t("flow.visualization.showLegend") }}
          </o-checkbox>
        </o-field>
      </div>
    </div>
    <FloodingColorConfigurator
      :modelValue="modelValue.color"
      @update:modelValue="updateClause({ color: $event })"
      v-model:showLegend="showLegend"
    />
  </div>
</template>

<script setup lang="ts">
import { useValidator } from "@movici-flow-lib/composables/useValidator";
import type { ColorClause, FloodingGridClause, ScenarioDataset } from "@movici-flow-lib/types";
import { computed, inject, onUnmounted, provide, ref } from "vue";
import FloodingColorConfigurator from "./FloodingColorConfigurator.vue";
import { datasetsInjection, validatorInjection } from "./injectionKeys";

interface FloodingGridColorClause {
  floodingGrid?: FloodingGridClause;
  color?: ColorClause;
}

const props = defineProps<{
  modelValue: FloodingGridColorClause;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: FloodingGridColorClause): void;
}>();

const datasets = inject(datasetsInjection)!;
const validator = inject(validatorInjection)!.child("floodingGrid");
provide(validatorInjection, validator);
validator.configure({
  validators: {
    heightmap: () => {
      if (!props.modelValue.floodingGrid) return "Select a height map dataset";
    },
  },
});
const { errors, validated, destroyValidator } = useValidator(validator);
onUnmounted(destroyValidator);
validated("heightmap", () => props.modelValue.floodingGrid);

const showLegend = ref(false);
const localDataset = computed({
  get: () => datasets.value.find((d) => d.name === props.modelValue.floodingGrid?.heightMapDataset),
  set: (val) => {
    if (val) {
      updateClause({
        floodingGrid: {
          heightMapDataset: val.name,
        },
      });
    }
  },
});
function updateClause(clause: Partial<FloodingGridColorClause>) {
  emit("update:modelValue", { ...props.modelValue, ...clause });
}

function datasetFilter(dataset: ScenarioDataset) {
  return dataset.type === "height_map";
}
function displayName(dataset: ScenarioDataset) {
  return dataset.name;
}
</script>

<style scoped lang="scss"></style>
