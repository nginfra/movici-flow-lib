<template>
  <div class="modal-card">
    <div class="box has-background-white p-4">
      <o-field
        :message="errors['duplicateEntityId']"
        :variant="errors['duplicateEntityId'] && 'danger'"
      >
        <template #label>
          <div class="is-flex is-align-items-center">
            <label class="label is-size-7 mb-0 mr-2">{{
              t("flow.visualization.graph.chooseAttribute")
            }}</label>
            <o-icon
              :title="t('flow.visualization.graph.attributeInfo')"
              size="tiny"
              icon="info-circle"
              variant="info"
            />
          </div>
        </template>
        <AttributeSelector
          expanded
          v-model="selectedAttribute"
          :attributes="attributes"
          :attribute-filter="attributeFilter"
        />
      </o-field>
      <MovButtons
        size="small"
        isPulledRight
        :modelValue="buttons"
        @save="saveChart()"
        @saveAndEdit="saveChart(true)"
        @cancel="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AttributeSummary, AttributeType, DeckEntityObject } from "@movici-flow-lib/types";
import { IMPORTANT_ATTRIBUTES } from "@movici-flow-lib/types";
import { FormValidator } from "@movici-flow-lib/utils/FormValidator";
import AttributeSelector from "../AttributeSelector.vue";

import { useButtonArray } from "@movici-flow-lib/composables/useButtons";
import { useReactiveSummary } from "@movici-flow-lib/composables/useReactiveSummary";
import { useValidator } from "@movici-flow-lib/composables/useValidator";
import {
  ChartVisualizerInfo,
  ChartVisualizerItem,
} from "@movici-flow-lib/visualizers/VisualizerInfo";
import { computed } from "vue";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  modelValue: ChartVisualizerInfo[];
  scenarioUUID?: string;
  datasetName?: string;
  datasetUUID?: string;
  entityGroup?: string;
  object: DeckEntityObject<unknown>;
}>();

const { attributes, currentEntityName, currentDatasetUUID } = useReactiveSummary();
watch(
  () => [props.entityGroup, props.datasetUUID],
  ([entityGroup, datasetUUID]) => {
    currentEntityName.value = entityGroup;
    currentDatasetUUID.value = datasetUUID;
  },
  { immediate: true },
);

const emit = defineEmits<{
  (e: "addChart", val: [ChartVisualizerItem, boolean?]): void;
  (e: "close"): void;
}>();

const validator = ref(
  new FormValidator({
    validators: {
      duplicateEntityId: () => {
        const found = props.modelValue.find((chart) => {
          return chart.items.some((i) => {
            return (
              i.datasetName == props.datasetName &&
              i.entityGroup == props.entityGroup &&
              i.attribute === selectedAttribute.value?.name &&
              i.entityId === props.object.id &&
              i.entityIdx === props.object.idx
            );
          });
        });
        if (found)
          return "A chart with this attribute and entity already exists, please select a different attribute.";
      },
    },
  }),
);
const { validated, errors, hasErrors } = useValidator(validator);
const selectedAttribute = validated("selectedAttribute", ref<AttributeType>(), { immediate: true });

const allowedDataTypes = ["INT", "DOUBLE", "BOOLEAN"];

const disabledButtons = computed(() => {
  const disabled = !selectedAttribute.value || hasErrors.value;
  return {
    save: disabled,
    saveAndEdit: disabled,
  };
});
const buttons = useButtonArray(["save", "saveAndEdit", "cancel"], disabledButtons);
function attributeFilter(attr: AttributeSummary): boolean {
  return allowedDataTypes.includes(attr.data_type);
}

function saveChart(edit?: boolean) {
  const attribute = selectedAttribute.value?.name;
  if (attribute) {
    const item = new ChartVisualizerItem({
      attribute,
      datasetName: props.datasetName,
      datasetUUID: props.datasetUUID,
      entityGroup: props.entityGroup,
      entityId: props.object.id,
      entityIdx: props.object.idx,
      name: getItemName(props.object),
      settings: {},
    });
    emit("addChart", [item, edit]);
  }
  emit("close");
}

function getItemName(obj: DeckEntityObject<unknown>): string {
  for (const attr of IMPORTANT_ATTRIBUTES) {
    const val = obj[attr];
    if (val) return val;
  }
  return "#" + obj.id;
}
</script>
<style lang="scss" scoped>
.modal-card {
  width: inherit;
}
</style>
