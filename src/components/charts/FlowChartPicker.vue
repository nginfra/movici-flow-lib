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
        <div class="group-picker chart" itemKey="id">
          <div class="header">
            <span class="grip mr-2">
              <span class="icon is-small fa-stack">
                <i class="far fa-ellipsis-v" />
                <i class="far fa-ellipsis-v" />
              </span>
            </span>
            <label class="is-flex-grow-1 label" :title="element.name">
              <span class="is-block is-size-6-half text-ellipsis">
                {{ element.title }}
              </span>
            </label>
            <MovKebabMenu
              :modelValue="actions"
              @edit="startEditingItem(index)"
              @delete="deleteItem(index)"
            />
          </div>
        </div>
      </template>
    </Draggable>
    <AttributeChartConfig
      v-if="currentItem"
      :modelValue="currentItem"
      @update:modelValue="updateCurrentItem"
      @close="close"
    />
  </div>
</template>

<script setup lang="ts">
import Draggable from "vuedraggable";
import AttributeChartConfig from "./AttributeChartConfig.vue";
import { useDraggable } from "@movici-flow-lib/composables/useDraggable";
import { useVisualizerList } from "@movici-flow-lib/composables/useVisualizerList";
import type { ActionItem } from "@movici-flow-lib/types";
import type { ChartVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  modelValue: ChartVisualizerInfo[];
  open: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: ChartVisualizerInfo[]): void;
  (e: "update:open", val?: number): void;
}>();

const actions: ActionItem[] = [
  {
    icon: "edit",
    iconPack: "far",
    label: "Edit",
    event: "edit",
  },
  {
    icon: "trash",
    iconPack: "far",
    label: "Delete",
    event: "delete",
    variant: "danger",
  },
];

const items = computed(() => props.modelValue);

const { draggableEvents, draggableOptions, dragging, move } = useDraggable(items, "visualizers");

const {
  startEditingItem,
  deleteItem,
  currentItem,
  updateCurrentItem,
  close,
  open: openLocal,
} = useVisualizerList({
  items,
  strategy: {
    createNewMessage: () => t("flow.visualization.newVisualizer"),
    closeConfiguratorMessage: () => t("flow.visualization.dialogs.closeConfigurator"),
    deleteMessage: (item?: ChartVisualizerInfo) =>
      t("flow.visualization.dialogs.deleteChart", { name: item?.title ?? "this" }),
    onUpdate(val: ChartVisualizerInfo[]) {
      emit("update:modelValue", val);
    },
  },
  t,
});
watch(
  () => props.open,
  () => {
    if (props.open == null) return;
    openLocal.value = props.open;
  }
);

watch(openLocal, (val) => emit("update:open", val));
function draggableChange(event: { moved: { oldIndex: number; newIndex: number } }) {
  emit("update:modelValue", move(event.moved.oldIndex, event.moved.newIndex, props.modelValue));
}
</script>

<style scoped lang="scss">
.chart {
  background-color: $white-ter;
  .header {
    background-color: $white-ter;
    .label {
      max-width: 200px;
      .attribute {
        color: $grey-dark;
        font-weight: 300;
        font-size: 0.75rem;
      }
    }
    .control {
      flex: 1;
    }
  }
}
</style>
