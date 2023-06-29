<template>
  <div>
    <ByValueConfigurator
      v-if="selectedAttribute"
      v-model="local.sizes"
      :selectedAttribute="selectedAttribute"
      :strategy="strategy"
      component="MovNumberinput"
      :componentProps="{ size: 'small' }"
      :label="header"
    >
      <template #options-side>
        <o-field :label="$t('flow.visualization.displayAs')">
          <o-radio
            v-model="local.units"
            :disabled="noSizeInMeter"
            native-value="meters"
            size="small"
            class="mr-4"
          >
            {{ $t("units.meters") }}
          </o-radio>
          <o-radio v-model="local.units" native-value="pixels" size="small">
            {{ $t("units.pixels") }}
          </o-radio>
        </o-field>
      </template>
    </ByValueConfigurator>
    <MinMaxPixels
      v-if="local.units === 'meters'"
      v-model:minPixels="local.minPixels"
      v-model:maxPixels="local.maxPixels"
      :units="local.units"
    />
  </div>
</template>

<script setup lang="ts">
import type { AttributeSummary, ByValueSizeClause, SizeClause } from "@movici-flow-lib/types";
import { FlowVisualizerType } from "@movici-flow-lib/types";
import { computed, inject, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import ByValueConfigurator from "./ByValueConfigurator.vue";
import MinMaxPixels from "./MinMaxPixels.vue";
import {
  MappingStrategy,
  ValueMappingHelper,
  interpolateMinMax,
  type ValueMapping,
} from "./ValueMappingHelper";
import { geometryInjection } from "./injectionKeys";

class SizeMappingStrategy extends MappingStrategy<number> {
  geometry: FlowVisualizerType;

  constructor(geometry: FlowVisualizerType) {
    super();
    this.geometry = geometry;
  }
  protected doRecalculateOutputs(outputs: number[], nSteps: number): number[] {
    const first = outputs[0] ?? this.defaultOutput();
    const last = outputs[outputs.length - 1] ?? this.defaultOutput();
    return interpolateMinMax(first, last, nSteps, true);
  }

  defaultMapping(mapping: ValueMapping<number>, helper: ValueMappingHelper<number>) {
    return helper.recalculateMapping({
      mapping: [
        [0, this.defaultOutput()],
        [1, this.defaultOutput() * 2],
      ],
      nSteps: this.defaultStepCount(),
      resetMinMax: true,
    });
  }
  defaultStepCount(): number {
    return 2;
  }
  private defaults(): { size: number; minPixels: number; maxPixels: number } {
    switch (this.geometry) {
      case FlowVisualizerType.ICONS:
        return {
          size: 20,
          minPixels: 5,
          maxPixels: 100,
        };
      case FlowVisualizerType.POINTS:
      case FlowVisualizerType.LINES:
      case FlowVisualizerType.POLYGONS:
      case FlowVisualizerType.ARCS:
      case FlowVisualizerType.GRID:
      default:
        return {
          size: 5,
          minPixels: 2,
          maxPixels: 20,
        };
    }
  }
  defaultOutput(): number {
    return this.defaults().size;
  }

  minPixels(): number {
    return this.defaults().minPixels;
  }
  maxPixels(): number {
    return this.defaults().maxPixels;
  }
}

const { t } = useI18n();
const props = defineProps<{
  modelValue?: SizeClause;
  selectedAttribute?: AttributeSummary;
  noSizeInMeter?: boolean;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: SizeClause): void;
}>();

const geometry = inject(geometryInjection)!;
const strategy = computed(() => new SizeMappingStrategy(geometry.value));

const local = reactive<Omit<ByValueSizeClause, "attribute">>({
  units: "pixels",
  sizes: [],
  minPixels: strategy.value.minPixels(),
  maxPixels: strategy.value.maxPixels(),
});

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(local, val?.byValue);
  },
  { immediate: true }
);

const currentClause = computed<ByValueSizeClause | null>(() => {
  if (!props.selectedAttribute) return null;

  const rv: ByValueSizeClause = {
    attribute: props.selectedAttribute,
    sizes: local.sizes,
    units: local.units,
  };
  if (local.minPixels !== null) {
    rv.minPixels = local.minPixels;
  }

  if (local.maxPixels !== null) {
    rv.maxPixels = local.maxPixels;
  }
  return rv;
});
watch(currentClause, (byValue) => {
  if (!byValue) return;
  emit("update:modelValue", { byValue });
});

const header = computed(() => {
  const miniUnits = local.units === "meters" ? "m" : local.units === "pixels" ? "px" : "";
  return `${t("flow.visualization.sizeConfig.size")} (${miniUnits})`;
});
</script>

<style scoped lang="scss"></style>
