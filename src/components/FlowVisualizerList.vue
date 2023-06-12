<template>
  <div class="overflow visualizer-list is-flex is-flex-direction-column">
    <Draggable
      :modelValue="modelValue"
      :item-key="strategy.itemKey"
      v-bind="draggableOptions"
      v-on="draggableEvents"
      class="draggable"
      :class="{ dashed: dragging }"
      @change="draggableChange"
    >
      <template #item="props">
        <slot name="item" v-bind="{ ...props, ...itemSlotProps }" />
      </template>
    </Draggable>

    <o-button
      v-if="allowCreateNew"
      class="mt-2 is-transparent has-hover-bg is-borderless is-align-self-baseline has-text-primary has-text-weight-bold"
      icon-left="plus-circle"
      icon-pack="far"
      size="small"
      @click="startEditingItem(-1)"
    >
      {{ evaluateMessage(strategy.createNewMessage) }}
    </o-button>
    <template v-if="openVal > -2">
      <slot name="configurator" v-bind="configuratorSlotProps" />
    </template>
  </div>
</template>

<script lang="ts">
export type FunctionOrString<T> = string | ((item?: T) => string);
export interface VisualizerListStrategy<T> {
  name: string;
  itemKey: string;
  createNewMessage: FunctionOrString<T>;
  closeConfiguratorMessage: FunctionOrString<T>;
  deleteMessage: FunctionOrString<T>;
  finalizeItem?: (item: T) => T;
}
</script>
<script setup lang="ts" generic="T extends unknown">
import { useDialog } from "@movici-flow-common/baseComposables/useDialog";
import { useDraggable } from "@movici-flow-common/composables/useDraggable";
import { computed, nextTick, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import Draggable from "vuedraggable";

const { openDialog } = useDialog();
const { t } = useI18n();
const props = defineProps<{
  modelValue: T[];
  strategy: VisualizerListStrategy<T>;
  open?: number;
  allowCreateNew?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: T[]): void;
  (e: "update:open", val?: number): void;
}>();

// openVal Indicates the index of the open Visualizer
// Special values are
// -1: Creates a new Visualizer
// -2: The configurator is closed
const openVal = ref(-2);

watch(
  () => props.open,
  (open) => {
    if (open == null) return;
    openVal.value = open;
  }
);

watch(openVal, (open) => emit("update:open", open));

const { draggableEvents, draggableOptions, dragging, move } = useDraggable(
  toRef(props, "modelValue"),
  "visualizers"
);
function draggableChange(event: { moved: { oldIndex: number; newIndex: number } }) {
  emit("update:modelValue", move(event.moved.oldIndex, event.moved.newIndex, props.modelValue));
}

const itemSlotProps = computed(() => ({
  updateItem,
  deleteItem,
  startEditingItem,
  close,
}));

const configuratorSlotProps = computed(() => ({
  item: currentItem.value,
  updateItem: updateCurrentItem,
  close,
}));
function evaluateMessage<T>(message: FunctionOrString<T>, item?: T) {
  return typeof message == "string" ? message : message(item);
}

function close() {
  openVal.value = -2;
}

// needs to detect unchanged saves in the VisConfig
function startEditingItem(index: number) {
  if (openVal.value === -2) {
    openVal.value = index;
  } else if (openVal.value !== index) {
    // todo: detect changes in current visualizer configurator
    openDialog({
      message: evaluateMessage(props.strategy.closeConfiguratorMessage, props.modelValue[index]),
      cancelText: t("actions.cancel"),
      confirmButtonText: t("misc.yes"),
      variant: "primary",
      canCancel: true,
      onConfirm: () => {
        // By first closing the old configurator and then opening a new one we force a recycle
        // of the configurator and clean up any residual data
        close();
        nextTick(() => {
          openVal.value = index;
        });
      },
    });
  }
}

function updateItem(idx: number, val: T) {
  emit(
    "update:modelValue",
    props.modelValue.map((info, arrayIdx) => {
      return arrayIdx === idx ? props.strategy.finalizeItem?.(val) ?? val : info;
    })
  );
}

function appendItem(val: T) {
  emit("update:modelValue", [...props.modelValue, props.strategy.finalizeItem?.(val) ?? val]);
}

const currentItem = computed(() => {
  return openVal.value < 0 ? undefined : props.modelValue[openVal.value];
});

function updateCurrentItem(val?: T) {
  if (!val) return;
  if (openVal.value === -1) {
    openVal.value = props.modelValue.length;
    appendItem(val);
  } else {
    updateItem(openVal.value, val);
  }
}

function deleteItem(idx: number) {
  openDialog({
    message: evaluateMessage(props.strategy.deleteMessage, props.modelValue[idx]),
    cancelText: t("actions.cancel"),
    confirmButtonText: t("actions.delete"),

    variant: "danger",
    canCancel: true,
    onConfirm: () => {
      emit(
        "update:modelValue",
        props.modelValue.filter((_, arrayIdx) => idx !== arrayIdx)
      );
      // if we delete what is open, we close the window
      if (openVal.value === idx) {
        close();
      }
    },
  });
}
</script>

<style scoped lang="scss">
.draggable {
  margin: 0;
}
.visualizer-list {
  height: 100%;
  margin: 0.5rem -0.25rem 0.5rem 0;
  padding-right: 0.25rem;
}
:deep(.label) {
  color: $black !important;
}
</style>
