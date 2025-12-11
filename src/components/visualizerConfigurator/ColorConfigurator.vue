<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop">
        <o-field>
          <o-radio class="mr-4" v-model="clauseType" native-value="static" size="small">
            {{ t("flow.visualization.static") }}</o-radio
          >
          <o-radio v-model="clauseType" native-value="byValue" size="small">
            {{ t("flow.visualization.byValue") }}
          </o-radio>
        </o-field>
      </div>
      <div class="column is-one-third-desktop">
        <o-field>
          <o-checkbox v-model="showLegend" size="small">
            {{ t("flow.visualization.showLegend") }}
          </o-checkbox>
        </o-field>
      </div>
    </div>
    <template v-if="clauseType">
      <ColorStaticConfigurator
        v-if="clauseType === 'static'"
        :modelValue="localClause"
        @update:modelValue="updateClause"
      />
      <template v-else-if="clauseType === 'byValue'">
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
                :attribute-filter="isAttributeSupported"
              />
            </o-field>
          </div>
        </div>
        <ColorByValueConfigurator
          v-if="selectedAttribute"
          :modelValue="localClause"
          @update:modelValue="updateClause"
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
      </template>
      <hr />
      <ColorAdvSettingsConfigurator
        :modelValue="localClause.advanced"
        :fillType="fillType"
        :clauseType="clauseType"
        @update:modelValue="updateClause({ advanced: $event })"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import AttributeSelector from "@movici-flow-lib/components/AttributeSelector.vue";
import { useClauseConfigurator } from "@movici-flow-lib/composables/useClauseConfigurator";
import type { ColorClause } from "@movici-flow-lib/types";
import { computed, inject, onUnmounted, provide, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import ColorAdvSettingsConfigurator from "./ColorAdvSettingsConfigurator.vue";
import ColorByValueConfigurator from "./ColorByValueConfigurator.vue";
import ColorStaticConfigurator from "./ColorStaticConfigurator.vue";
import LegendLabelsConfigurator from "./LegendLabelsConfigurator.vue";
import { attributesInjection, validatorInjection } from "./injectionKeys";
import cloneDeep from "lodash/cloneDeep";
const { t } = useI18n();

const props = defineProps<{
  modelValue?: ColorClause;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: ColorClause): void;
}>();

const attributes = inject(attributesInjection)!;
const validator = inject(validatorInjection)!.child("color");
provide(validatorInjection, validator);

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
    if (localClause.advanced) {
      toEmit.advanced = localClause.advanced;
    }
    if (showLegend.value) {
      toEmit.legend = localClause.legend;
    }
    emit("update:modelValue", toEmit);
  },
});

onUnmounted(destroyValidator);
const showLegend = ref(!!props.modelValue?.legend);
watch(showLegend, () => {
  if (showLegend) {
    localClause.legend ??= {};
  }
  updateClause();
});

const fillType = computed<"buckets" | "gradient" | undefined>(() => {
  return localClause?.byValue?.type;
});
</script>

<style lang="scss"></style>
