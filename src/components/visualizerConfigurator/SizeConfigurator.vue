<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <o-radio class="mr-4" v-model="clauseType" native-value="static" size="small">
          {{ $t("flow.visualization.static") }}
        </o-radio>
        <o-radio v-model="clauseType" native-value="byValue" size="small">
          {{ $t("flow.visualization.byValue") }}
        </o-radio>
      </div>
    </div>
    <div v-if="clauseType">
      <SizeStaticConfigurator
        v-if="clauseType === 'static'"
        :modelValue="localClause"
        @update:modelValue="updateClause"
        :no-size-in-meter="geometry === FlowVisualizerType.ICONS"
      />
      <template v-else-if="clauseType === 'byValue'">
        <div class="columns mb-0 is-multiline">
          <div class="column is-two-thirds-desktop is-full-tablet">
            <o-field
              required
              :label="$t('flow.visualization.basedOn')"
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
        <SizeByValueConfigurator
          v-if="selectedAttribute"
          :modelValue="localClause"
          @update:modelValue="updateClause"
          :selectedAttribute="selectedAttribute"
          :no-size-in-meter="geometry === FlowVisualizerType.ICONS"
        />
      </template>
      <hr />

      <o-collapse v-model:open="miscIsOpen">
        <template #trigger="{ open }">
          <span class="is-flex is-align-items-center mb-2">
            <o-button
              class="mr-2 is-transparent is-borderless"
              size="small"
              :icon-left="open ? 'angle-down' : 'angle-up'"
            />
            <label class="is-size-6-half ml-1">
              {{ $t("flow.visualization.sizeConfig.miscellaneous") }}
            </label>
          </span>
        </template>
        <div class="columns mt-4 pl-1 is-multiline">
          <div class="column py-0 is-two-thirds-desktop">
            <o-field>
              <o-checkbox
                size="small"
                :modelValue="localClause.dashed"
                @update:modelValue="updateClause({ dashed: $event })"
              >
                {{ $t("flow.visualization.sizeConfig.dashed") }}
              </o-checkbox>
            </o-field>
          </div>
        </div>
      </o-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClauseConfigurator } from "@movici-flow-lib/composables/useClauseConfigurator";
import { FlowVisualizerType, type SizeClause } from "@movici-flow-lib/types";
import { computed, inject, onUnmounted, provide, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import AttributeSelector from "../AttributeSelector.vue";
import SizeByValueConfigurator from "./SizeByValueConfigurator.vue";
import SizeStaticConfigurator from "./SizeStaticConfigurator.vue";
import { attributesInjection, geometryInjection, validatorInjection } from "./injectionKeys";

const { t } = useI18n();

const props = defineProps<{
  modelValue?: SizeClause;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: SizeClause): void;
}>();
const miscIsOpen = ref(!!props.modelValue?.dashed);

const attributes = inject(attributesInjection)!;
const geometry = inject(geometryInjection)!;
const validator = inject(validatorInjection)!.child("size");
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
  supportedDataTypes: ["BOOLEAN", "INT", "DOUBLE"],
  t,
  validator,
  modelValue: computed(() => props.modelValue),
  onEmit: (toEmit) => {
    if (localClause.dashed) {
      toEmit.dashed = localClause.dashed;
    }
    emit("update:modelValue", toEmit);
  },
});

onUnmounted(destroyValidator);

watch(
  () => props.modelValue,
  (clause) => {
    if (clause?.dashed) {
      localClause.dashed = true;
    }
  },
  { immediate: true }
);
</script>

<style lang="scss"></style>
