<template>
  <div class="visualizer-list is-flex is-flex-direction-column">
    <Draggable
      :modelValue="modelValue"
      item-key="id"
      v-bind="draggableOptions"
      v-on="draggableEvents"
      class="draggable"
      :class="{ dashed: dragging }"
      @change="draggableChange"
    >
      <template #item="{ index, element }">
        <VisualizerElement
          :modelValue="element"
          :header-buttons="['grip', 'label', 'visibility', 'more', 'errors']"
          :action-buttons="['edit', 'delete', 'export', 'reload']"
          @update:modelValue="updateItem(index, $event)"
          @edit="startEditingItem(index)"
          @delete="deleteItem(index)"
          @export="$emit('export', element)"
          @reload="reloadItem(index, updateItem)"
          tooltipActive
        />
      </template>
    </Draggable>

    <o-button
      class="mt-2 is-transparent has-hover-bg is-borderless is-align-self-baseline has-text-primary has-text-weight-bold"
      icon-left="plus-circle"
      icon-pack="far"
      size="small"
      @click="startEditingItem(-1)"
    >
      {{ t("flow.visualization.newVisualizer") }}
    </o-button>
    <VisualizerConfigurator
      v-if="editing"
      :modelValue="currentItem"
      @update:modelValue="updateCurrentItem"
      :scenario="scenario"
      @close="close"
    />
  </div>
</template>

<script setup lang="ts">
import Draggable from "vuedraggable";

import { useDraggable } from "@movici-flow-common/composables/useDraggable";
import { useVisualizerList } from "@movici-flow-common/composables/useVisualizerList";
import type { Scenario } from "@movici-flow-common/types";
import type { ComposableVisualizerInfo } from "@movici-flow-common/visualizers/VisualizerInfo";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import VisualizerElement from "./VisualizerElement.vue";
import VisualizerConfigurator from "./visualizerConfigurator/VisualizerConfigurator.vue";
const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    modelValue: ComposableVisualizerInfo[];
    scenario?: Scenario | null;
    open?: number;
  }>(),
  { open: -2 }
);
const emit = defineEmits<{
  (e: "update:modelValue", val: ComposableVisualizerInfo[]): void;
  (e: "update:open", val?: number): void;
}>();

const items = computed(() => props.modelValue);

const { draggableEvents, draggableOptions, dragging, move } = useDraggable(items, "visualizers");

const {
  updateItem,
  startEditingItem,
  deleteItem,
  open,
  editing,
  currentItem,
  updateCurrentItem,
  close,
} = useVisualizerList({
  items,
  strategy: {
    createNewMessage: () => t("flow.visualization.newVisualizer"),
    closeConfiguratorMessage: () => t("flow.visualization.dialogs.closeConfigurator"),
    deleteMessage: (item?: ComposableVisualizerInfo) =>
      t("flow.visualization.dialogs.deleteVisualizer", { name: item?.name ?? "this" }),
    finalizeItem(info: ComposableVisualizerInfo) {
      if (props.scenario && !info.scenarioUUID) {
        info.scenarioUUID = props.scenario.uuid;
      }
      return info;
    },
    onUpdate(val: ComposableVisualizerInfo[]) {
      emit("update:modelValue", val);
    },
  },
  t,
});

watch(
  () => props.open,
  () => {
    if (props.open == null) return;
    open.value = props.open;
  }
);

watch(open, (val) => emit("update:open", val));

function draggableChange(event: { moved: { oldIndex: number; newIndex: number } }) {
  emit("update:modelValue", move(event.moved.oldIndex, event.moved.newIndex, props.modelValue));
}

function reloadItem(idx: number, update: (idx: number, item: ComposableVisualizerInfo) => void) {
  const item = props.modelValue[idx];
  if (item) {
    update(idx, item.forceReset());
  }
}
</script>

<style scoped lang="scss">
.draggable {
  margin: 0;
}
.layer-picker-container {
  height: 100%;
  margin: 0.5rem -0.25rem 0.5rem 0;
  padding-right: 0.25rem;
}
:deep(.label) {
  color: $black !important;
}
</style>
