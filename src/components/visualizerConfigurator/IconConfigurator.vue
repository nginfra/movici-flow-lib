<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop">
        <o-field>
          <o-radio class="mr-4" v-model="clauseType" native-value="static" size="small">
            {{ t("flow.visualization.static") }}
          </o-radio>
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
    <IconStaticConfigurator
      v-if="clauseType === 'static'"
      :modelValue="localClause"
      @update:modelValue="updateClause"
      :iconOptions="iconMapping"
      :buttons="staticConfiguratorButtons"
    />
    <template v-else-if="clauseType === 'byValue'">
      <div class="columns mb-0 is-multiline">
        <div class="column is-two-thirds-desktop is-full-tablet">
          <o-field
            required
            :label="t('flow.visualization.basedOn')"
            :message="errors['selectedAttribute']"
            :type="errors['selectedAttribute'] && 'danger'"
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
      <ByValueConfigurator
        v-if="selectedAttribute"
        v-model="icons"
        :selectedAttribute="selectedAttribute"
        :component="IconSelector"
        :componentProps="componentProps"
        :strategy="strategy"
        :label="t('flow.visualization.iconConfig.shapes')"
      >
        <template v-if="showLegend" #legend-labels="{ placeholders }">
          <LegendLabelsConfigurator
            :modelValue="localClause.legend"
            @update:modelValue="updateClause({ legend: $event })"
            :placeholders="placeholders"
            reversed
          />
        </template>
      </ByValueConfigurator>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useClauseConfigurator } from "@movici-flow-lib/composables/useClauseConfigurator";
import type { IconClause } from "@movici-flow-lib/types";
import { MAPPED_ICONS } from "@movici-flow-lib/visualizers/visualizerModules/iconCommon";
import { computed, inject, onUnmounted, provide, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import AttributeSelector from "../AttributeSelector.vue";
import ByValueConfigurator from "./ByValueConfigurator.vue";
import IconSelector from "./IconSelector.vue";
import IconStaticConfigurator from "./IconStaticConfigurator.vue";
import LegendLabelsConfigurator from "./LegendLabelsConfigurator.vue";
import { MappingStrategy } from "./ValueMappingHelper";
import { attributesInjection, validatorInjection } from "./injectionKeys";
import type { IconMapping } from "@movici-flow-lib/visualizers/layers/ShapeIconLayer";

class IconMappingStrategy extends MappingStrategy<string> {
  mapping: IconMapping;
  constructor(mapping: IconMapping) {
    super();
    this.mapping = mapping;
  }
  defaultStepCount(): number {
    return 4;
  }

  defaultOutput(): string {
    return Object.keys(this.mapping)[0] ?? "";
  }
}
const { t } = useI18n();

const props = defineProps<{
  modelValue?: IconClause;
  iconGroup: "icons" | "shapes";
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: IconClause): void;
}>();

const attributes = inject(attributesInjection)!;
const validator = inject(validatorInjection)!.child(props.iconGroup);
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
    if (showLegend.value) {
      toEmit.legend = localClause.legend;
    }
    emit("update:modelValue", toEmit);
  },
});

onUnmounted(destroyValidator);

const icons = computed({
  get: () => localClause.byValue?.icons,
  set: (val) => {
    if (!val) return;
    updateClause({
      byValue: {
        attribute: selectedAttribute.value ?? null,
        icons: val,
      },
    });
  },
});

const showLegend = ref(false);
watch(showLegend, () => updateClause());
const staticConfiguratorButtons = computed(() => props.iconGroup === "shapes");

const iconMapping = computed(() => MAPPED_ICONS[props.iconGroup]);
const strategy = computed(() => new IconMappingStrategy(iconMapping.value));

const componentProps = computed(() => {
  return {
    iconOptions: iconMapping.value,
    placeholder: t("actions.select"),
    pack: "fas",
    expanded: true,
  };
});
</script>

<style scoped lang="scss"></style>
