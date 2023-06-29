<template>
  <ByValueConfigurator
    v-if="selectedAttribute"
    v-model="colorMapping"
    v-model:maxValue="maxValue"
    :selectedAttribute="selectedAttribute"
    :component="ColorInput"
    :componentProps="componentProps"
    :strategy="strategy"
    :label="$t('flow.visualization.colorConfig.colors')"
    :buckets="fillType === 'buckets'"
  >
    <template #options-top="{ mappingHelper }">
      <div class="columns mb-0 is-multiline">
        <div class="column is-full">
          <div>
            <o-field class="fill-type">
              <o-radio
                class="mr-4"
                v-for="kind in ['buckets', 'gradient']"
                v-model="fillType"
                :key="kind"
                :native-value="kind"
                size="small"
                :disabled="!isMode(mappingHelper, 'number')"
              >
                {{ $t("flow.visualization.colorConfig." + kind) }}
              </o-radio>
            </o-field>
          </div>
        </div>
      </div>
    </template>

    <template #options-side>
      <ColorPaletteSelector v-model="colorPalette" :nSteps="nSteps" />
    </template>

    <template #after-output="{ mappingHelper }">
      <div class="gradient-container is-flex-shrink-1" v-if="isMode(mappingHelper, 'continuous')">
        <div class="gradient" :style="gradientColorStyle"></div>
      </div>
    </template>

    <template #legend-labels="{ placeholders }">
      <slot name="legend-labels" v-bind="{ placeholders }" />
    </template>
  </ByValueConfigurator>
</template>

<script setup lang="ts">
import ColorInput from "@movici-flow-lib/components/ColorInput.vue";
import type {
  AttributeSummary,
  ByValueColorClause,
  ColorClause,
  ColorMapping,
} from "@movici-flow-lib/types";
import { colorTripleToHex } from "@movici-flow-lib/visualizers/maps/colorMaps";
import { computed, ref, watch, type Ref } from "vue";
import ByValueConfigurator from "./ByValueConfigurator.vue";
import ColorPaletteSelector from "./ColorPaletteSelector.vue";
import type { ValueMappingHelper, MappingMode } from "./ValueMappingHelper";
import { DEFAULT_COLOR_PALETTES } from "./colorPalettes";
import ColorMappingStrategy from "./ColorMappingStrategy";

const props = withDefaults(
  defineProps<{
    modelValue?: ColorClause;
    selectedAttribute?: AttributeSummary;
    strategy?: ColorMappingStrategy;
  }>(),
  {
    strategy: () => new ColorMappingStrategy(DEFAULT_COLOR_PALETTES["Sequential"][0]),
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: ColorClause): void;
}>();

const colorMapping = ref([]) as Ref<ColorMapping>;
const fillType = ref<"buckets" | "gradient">("buckets");
const maxValue = ref<number>();

const nSteps = computed(() => colorMapping.value.length);

const currentClause = computed(() => {
  if (!props.selectedAttribute) return null;

  const rv: ByValueColorClause = {
    type: fillType.value,
    attribute: props.selectedAttribute,
    colors: colorMapping.value,
  };
  if (fillType.value === "buckets" && maxValue.value != null) {
    rv.maxValue = maxValue.value;
  }
  return rv;
});

const componentProps = computed(() => ({
  caret: fillType.value === "gradient",
  colorPickerPosition: "right",
}));

const gradientColorStyle = computed(() => {
  const hexColors = colorMapping.value.map((c) => colorTripleToHex(c[1]));
  const gradientString = hexColors.reverse().join();
  return "background: linear-gradient(" + gradientString + ")";
});

const colorPalette = computed({
  get: () => props.strategy.palette,
  set: (palette) => {
    props.strategy.setColorPalette(palette);
    if (palette) {
      const newColors = props.strategy.recalculateOutputs([], colorMapping.value.length);
      colorMapping.value = colorMapping.value.map(([val], idx) => {
        return [val, newColors[idx]];
      });
    }
  },
});
function isMode(helper: ValueMappingHelper<unknown>, mode: MappingMode) {
  return helper.modeFlags.includes(mode);
}

watch(currentClause, (byValue) => {
  if (byValue) {
    emit("update:modelValue", { byValue });
  }
});

(() => {
  fillType.value = props.modelValue?.byValue?.type ?? "buckets";

  const clause = props.modelValue?.byValue;
  if (clause) {
    if (clause.colors?.length) {
      colorMapping.value = clause.colors;
    }
    maxValue.value = clause.maxValue;
  }
})();
</script>

<style scoped lang="scss">
.gradient-container {
  margin-right: 5px;
  padding: 11px 0 11px 11px;

  .gradient {
    height: 100%;
    width: 8px;
  }
}
</style>
