<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <o-field
          required
          :label="t('flow.visualization.basedOn')"
          :message="errors['selectedAttribute']"
          :variant="errors['selectedAttribute'] && 'danger'"
        >
          <AttributeSelector
            :modelValue="selectedAttribute"
            @update:modelValue="selectAttribute"
            :attributes="attributes"
            :attributeFilter="isAttributeSupported"
          />
        </o-field>
      </div>
    </div>
    <ColorByValueConfigurator
      v-if="selectedAttribute"
      :modelValue="modelValue"
      @update:modelValue="updateClause"
      :strategy="strategy"
      :selectedAttribute="selectedAttribute"
    >
      <template #legend-labels="{ placeholders }">
        <LegendLabelsConfigurator
          v-if="showLegend"
          :modelValue="localClause.legend"
          @update:modelValue="updateClause({ legend: $event })"
          :placeholders="placeholders"
          reversed
        />
      </template>
    </ColorByValueConfigurator>
  </div>
</template>

<script setup lang="ts">
import { useClauseConfigurator } from "@movici-flow-lib/composables/useClauseConfigurator";
import type { ColorClause, RGBAColor } from "@movici-flow-lib/types";
import { computed, inject, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import AttributeSelector from "../AttributeSelector.vue";
import ColorByValueConfigurator from "./ColorByValueConfigurator.vue";
import ColorMappingStrategy from "./ColorMappingStrategy";
import LegendLabelsConfigurator from "./LegendLabelsConfigurator.vue";
import type { ValueMapping, ValueMappingHelper } from "./ValueMappingHelper";
import { DEFAULT_COLOR_PALETTES } from "./colorPalettes";
import { attributesInjection, validatorInjection } from "./injectionKeys";

const { t } = useI18n();

const props = defineProps<{
  modelValue?: ColorClause;
  showLegend?: boolean;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: ColorClause): void;
  (e: "update:showLegend", val: boolean): void;
}>();

const attributes = inject(attributesInjection)!;
const validator = inject(validatorInjection)!;
const {
  selectedAttribute,
  selectAttribute,
  isAttributeSupported,
  destroyValidator,
  updateClause,
  errors,
  localClause,
  clauseType,
} = useClauseConfigurator({
  attributes,
  validator,
  supportedDataTypes: ["BOOLEAN", "INT", "DOUBLE"],
  t,
  modelValue: computed(() => props.modelValue),
  onEmit: (toEmit) => {
    if (props.showLegend) {
      toEmit.legend = localClause.legend;
    }
    emit("update:modelValue", toEmit);
  },
});
onUnmounted(destroyValidator);
clauseType.value = "byValue";

onMounted(() => {
  if (props.modelValue?.legend) {
    emit("update:showLegend", true);
  }
});

class FloodingColorMappingStrategy extends ColorMappingStrategy {
  defaultMapping(_: ValueMapping<RGBAColor>, helper: ValueMappingHelper<RGBAColor>) {
    return helper.recalculateMapping({
      mapping: [
        [0, this.defaultOutput()],
        [helper.getMaxValue() ?? 0, this.defaultOutput()],
      ],
      nSteps: this.defaultStepCount(),
      forceRecalculateValues: true,
    });
  }
  defaultStepCount() {
    return 3;
  }
}
const strategy = new FloodingColorMappingStrategy(DEFAULT_COLOR_PALETTES["Flooding"][0]);
</script>
