<template>
  <div class="is-block">
    <div class="is-flex mt-1">
      <div class="is-flex-shrink-1 is-flex-direction-column mr-4">
        <span class="is-flex">
          <label class="label mr-1 is-flex-grow-1">{{ label }}</label>
          <MovKebabMenu :modelValue="outputActions" @invertOutput="invertOutput" />
        </span>
        <span class="is-flex">
          <div>
            <Draggable
              :modelValue="orderedValue"
              :item-key="draggableIndex"
              v-bind="draggableOptions"
              v-on="draggableEvents"
              class="draggable"
              :class="{ dashed: dragging }"
              @change="draggableChange"
            >
              <template #item="{ index, element }">
                <o-field class="is-flex output-item">
                  <span class="grip mx-1">
                    <span class="icon small fa-stack has-text-grey">
                      <i class="far fa-ellipsis-v"></i>
                      <i class="far fa-ellipsis-v"></i>
                    </span>
                  </span>
                  <span>
                    <component
                      :is="component"
                      v-bind="componentProps"
                      :modelValue="element[1]"
                      @update:modelValue="updateOutput(index, $event)"
                    />
                  </span>
                </o-field>
              </template>
            </Draggable>
          </div>
          <slot name="after-output" v-bind="{ output }"></slot>
        </span>
      </div>
      <div class="is-flex is-flex-grow-1 is-flex-direction-column">
        <span class="is-flex">
          <label class="label mr-1 is-flex-grow-1">
            {{ valueHeader }}
          </label>
          <MovKebabMenu
            v-if="isMode('number')"
            :modelValue="valueActions"
            @resetValues="emit('resetValues')"
            @interpolateMinMax="emit('interpolateMinMax')"
          />
        </span>
        <div class="is-flex is-flex-direction-column">
          <EnumInputs v-if="isMode('enum')" :modelValue="mappingValues" :enumLabels="enumLabels" />
          <BooleanInputs :modelValue="mappingValues" v-else-if="isMode('boolean')" />
          <ByValueNumberInputs
            :modelValue="mappingValues"
            @updateMappingValue="updateMappingValue($event.index, $event.val)"
            @removeRow="removeRow"
            :reversed="reversed"
            hasRemoveButton
            v-else-if="isMode('number')"
          >
            <template v-if="isMode('buckets')" #after="{ index }">
              <span class="values-dash mx-1"> - </span>
              <span class="is-flex-grow-1">
                <MovNumberinput
                  v-if="isMaxIndex(index)"
                  :modelValue="maxValue"
                  @update:modelValue="emit('update:maxValue', $event)"
                  :controls="false"
                  :min-step="1e-15"
                  size="small"
                />
                <MovNumberinput
                  v-else
                  :modelValue="mappingValues[bucketEndIndex(index)]"
                  :controls="false"
                  :min-step="1e-15"
                  size="small"
                  disabled
                />
              </span>
            </template>
          </ByValueNumberInputs>
        </div>
      </div>
    </div>
    <o-button
      v-if="isMode('number')"
      @click="emit('addRow')"
      class="is-size-7 is-transparent has-hover-bg is-borderless has-text-primary has-text-weight-bold mt-2"
      icon-pack="far"
      icon-left="plus-circle"
      size="small"
    >
      {{ t("flow.visualization.byValueConfig.addRow") }}
    </o-button>
  </div>
</template>

<script setup lang="ts" generic="T">
import { useDraggable } from "@movici-flow-lib/composables/useDraggable";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Draggable from "vuedraggable";
import BooleanInputs from "./BooleanInputs.vue";
import ByValueNumberInputs from "./ByValueNumberInputs.vue";
import EnumInputs from "./EnumInputs.vue";
import type { EnumValueMappingHelper, MappingMode, ValueMappingHelper } from "./ValueMappingHelper";
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    modelValue: [number, T][];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: any;
    componentProps?: Record<string, unknown>;
    mappingHelper: ValueMappingHelper<T>;
    maxValue?: number | null;
    reversed?: boolean;
    label?: string;
  }>(),
  {
    maxValue: 1,
    label: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: [number, T][]): void;
  (e: "update:maxValue", val: number): void;
  (e: "resetValues"): void;
  (e: "interpolateMinMax"): void;
  (e: "addRow"): void;
}>();

const orderedValue = computed(() => {
  return props.reversed ? props.modelValue.slice().reverse() : props.modelValue;
});

const { draggableEvents, draggableOptions, dragging, move } = useDraggable(
  orderedValue,
  "by-value-list"
);

const output = computed(() => {
  return orderedValue.value.map((val) => val[1]);
});

const mappingValues = computed(() => {
  return orderedValue.value.map((v) => v[0]);
});

const enumLabels = computed(() => {
  return (props.mappingHelper as EnumValueMappingHelper<T>).enumLabels;
});

const valueActions = computed(() => {
  return [
    {
      label: t("flow.visualization.resetValues"),
      icon: "undo",
      iconPack: "far",
      event: "resetValues",
    },
    {
      label: t("flow.visualization.interpolateMinMax"),
      icon: "sort",
      iconPack: "far",
      event: "interpolateMinMax",
      isDisabled: !isMode("number"),
    },
  ];
});
const outputActions = [
  {
    label: t("flow.visualization.invertOutput"),
    icon: "sort",
    iconPack: "far",
    event: "invertOutput",
  },
];

const valueHeader = computed(() => {
  let kind: string;
  if (isMode("enum")) {
    kind = "valueEnum";
  } else if (isMode("buckets")) {
    kind = "valueRange";
  } else {
    kind = "value";
  }
  return t("flow.visualization.byValueConfig." + kind);
});
function emitOriginalOrder(values: [number, T][]) {
  emit("update:modelValue", props.reversed ? values.slice().reverse() : values);
}

function removeRow(idx: number) {
  const data = [...orderedValue.value];
  data.splice(idx, 1);
  emitOriginalOrder(data);
}

function invertOutput() {
  emitOriginalOrder(
    orderedValue.value.map((val, i) => {
      return [val[0], props.modelValue[i]![1]];
    })
  );
}

function draggableIndex(item: [number, T]) {
  return orderedValue.value.indexOf(item);
}

function draggableChange(event: { moved: { oldIndex: number; newIndex: number } }) {
  emitOriginalOrder(
    move(event.moved.oldIndex, event.moved.newIndex, output.value).map((d, idx) => {
      return [mappingValues.value[idx]!, d];
    })
  );
}

function isMode(query: MappingMode) {
  return props.mappingHelper.modeFlags.includes(query);
}

function isMaxIndex(index: number) {
  return props.reversed ? index === 0 : index === orderedValue.value.length - 1;
}

function bucketEndIndex(index: number) {
  return props.reversed ? index - 1 : index + 1;
}

function updateOutput(idx: number, newValue: T) {
  emitOriginalOrder(
    orderedValue.value.map((item, arrayIdx) => {
      return arrayIdx === idx ? [item[0], newValue] : item;
    })
  );
}

function updateMappingValue(idx: number, newValue: number) {
  emitOriginalOrder(
    orderedValue.value.map((item, arrayIdx) => {
      return arrayIdx === idx ? [newValue, item[1]] : item;
    })
  );
}
</script>

<style lang="scss" scoped>
.output-item {
  position: relative;
  height: 30px;
}
.has-addons {
  span {
    line-height: 1.85rem;
  }
}
.grip {
  .icon {
    height: 0.8rem;
    width: 0.6rem;
    font-size: 14px;
    margin-bottom: 4px;
  }
}
</style>
