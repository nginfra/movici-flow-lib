<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <o-field>
          <o-checkbox :modelValue="showVisiblity" @update:modelValue="toggleVisiblity" size="small">
            {{ t("flow.visualization.byValue") }}
          </o-checkbox>
        </o-field>
      </div>
    </div>
    <template v-if="showVisiblity">
      <div class="columns mb-0 is-multiline">
        <div class="column is-two-thirds-desktop is-full-tablet">
          <o-field
            required
            :label="t('flow.visualization.basedOn')"
            :message="errors['selectedAttribute']"
            :variant="errors['selectedAttribute'] && 'danger'"
          >
            <AttributeSelector
              v-model="selectedAttribute"
              :attributes="attributes"
              :attributeFilter="isAttributeSupported"
              @update:modelValue="selectAttribute"
            />
          </o-field>
        </div>
      </div>
      <ByValueConfigurator
        v-if="selectedAttribute"
        v-model="mapping"
        v-model:maxValue="maxValue"
        :selectedAttribute="selectedAttribute"
        :strategy="strategy"
        :component="SimpleCheckbox"
        :label="t('flow.visualization.visibilityConfig.visible')"
        buckets
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import AttributeSelector from "@movici-flow-lib/components/AttributeSelector.vue";
import { useAttributes } from "@movici-flow-lib/composables/useAttributes";
import { useValidator } from "@movici-flow-lib/composables/useValidator";
import type { ByValueVisibilityClause, VisibilityClause } from "@movici-flow-lib/types";
import { computed, inject, onUnmounted, ref, watch, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import SimpleCheckbox from "./SimpleCheckbox.vue";

import ByValueConfigurator from "./ByValueConfigurator.vue";
import { MappingStrategy } from "./ValueMappingHelper";
import { attributesInjection, validatorInjection } from "./injectionKeys";
import isEqual from "lodash/isEqual";

class VisibilityMappingStrategy extends MappingStrategy<boolean> {
  defaultStepCount(): number {
    return 2;
  }

  defaultOutput(): boolean {
    return true;
  }
}
const strategy = new VisibilityMappingStrategy();

const { t } = useI18n();
const props = defineProps<{
  modelValue?: VisibilityClause;
}>();
const attributes = inject(attributesInjection)!;
const validator = inject(validatorInjection)!.child("visibility");

const emit = defineEmits<{
  (e: "update:modelValue", val?: VisibilityClause): void;
}>();

const showVisiblity = ref(false);
const mapping = ref([]) as Ref<ByValueVisibilityClause["mapping"]>;
const maxValue = ref<number>();

const {
  validateAttribute,
  selectedAttribute,
  selectAttributeOrFirst,
  selectAttribute,
  isAttributeSupported,
} = useAttributes({
  attributes,
  supportedDataTypes: ["BOOLEAN", "INT", "DOUBLE"],
  t,
});

validator.configure({
  validators: {
    selectedAttribute: validateAttribute(() => showVisiblity.value),
  },
});
const { validated, destroyValidator, errors } = useValidator(validator);
validated("selectedAttribute", selectedAttribute);
onUnmounted(destroyValidator);

const currentClause = computed(() => {
  if (!showVisiblity.value || !selectedAttribute.value) return;

  const rv: ByValueVisibilityClause = {
    attribute: selectedAttribute.value,
    mapping: mapping.value,
  };
  if (maxValue.value != null) {
    rv.maxValue = maxValue.value;
  }
  return rv;
});
watch(currentClause, (c) => emit("update:modelValue", c ? { byValue: c } : c));

function toggleVisiblity(val: boolean) {
  if (val) {
    selectAttributeOrFirst(currentClause.value?.attribute);
  }
  showVisiblity.value = val;
}
watch(attributes, (val, old) => {
  if (!isEqual(val, old)) {
    toggleVisiblity(false);
  }
});

(() => {
  const clause = props.modelValue?.byValue;
  mapping.value = clause?.mapping ?? [];
  maxValue.value = clause?.maxValue;

  const attribute = clause?.attribute;
  selectAttribute(attribute);
  toggleVisiblity(!!attribute);
})();
</script>

<style scoped lang="scss"></style>
