<template>
  <div class="chart-config" v-if="local">
    <header class="mb-2">
      <div class="row is-flex is-align-items-center">
        <o-icon pack="far" icon="chart-line" />
        <h1 class="is-size-4 has-text-weight-bold is-flex-grow-1 ml-2">
          {{ $t("flow.visualization.graph.title") }}
        </h1>
        <span class="close is-clickable" :title="$t('actions.close')" @click="$emit('close')">
          <o-icon pack="far" icon="times" />
        </span>
      </div>
      <div class="row">
        <h2 class="is-size-6">
          {{ selectedAttributeName }}
        </h2>
      </div>
    </header>
    <div class="columns mb-0">
      <div class="column">
        <o-field :label="$t('flow.visualization.graph.graphDisplayName')">
          <o-input
            size="small"
            class="is-size-7"
            v-model="local.title"
            :placeholder="local.title"
          />
        </o-field>
      </div>
    </div>

    <div class="contents mb-2" v-if="local.items.length">
      <label class="label is-size-6-half">{{ $t("flow.visualization.graph.lines") }}</label>
      <div class="box info mb-2 p-3 has-background-white-bis">
        <div class="header is-flex mb-0">
          <label class="label color is-size-7 is-flex-shrink-1 mr-2">
            {{ $t("flow.visualization.colorConfig.color") }}
          </label>
          <label class="label display-name is-size-7 is-flex-grow-1">
            {{ $t("properties.displayName") }}
          </label>
        </div>
        <Draggable
          :modelValue="items"
          :item-key="itemKey"
          v-bind="draggableOptions"
          v-on="draggableEvents"
          class="draggable contents"
          :class="{ dashed: dragging }"
          @change="onDrag"
        >
          <template #item="{ index, element }">
            <div class="item mb-1">
              <div class="is-flex is-align-items-center">
                <span class="grip mx-1">
                  <span class="icon small fa-stack has-text-grey">
                    <i class="far fa-ellipsis-v"></i>
                    <i class="far fa-ellipsis-v"></i>
                  </span>
                </span>
                <o-field class="is-flex-shrink-1 mr-2 mb-0">
                  <ColorInput
                    :modelValue="element.color"
                    @update:modelValue="updateColor(index, $event)"
                    colorPickerPosition="top-right"
                  />
                </o-field>
                <o-field class="is-flex-grow-1 is-align-items-center mr-2 mb-0">
                  <o-input expanded size="small" class="is-size-7" v-model="element.name" />
                </o-field>
                <o-button
                  class="is-borderless is-transparent has-hover-bg is-flex has-text-danger"
                  size="small"
                  @click="removeItem(index)"
                  icon-left="trash"
                  title="Remove graph"
                  :disabled="local.items.length === 1"
                />
                <o-button
                  class="is-borderless is-flex"
                  size="small"
                  @click="toggleDetails(index)"
                  :icon-left="showDetails[index] ? 'angle-up' : 'angle-down'"
                  :title="
                    !showDetails[index]
                      ? $t('flow.visualization.graph.showEntityDetails')
                      : $t('flow.visualization.graph.hideEntityDetails')
                  "
                />
              </div>
              <div
                v-if="showDetails[index]"
                class="details is-flex mt-2 mb-1 px-3 py-2 has-background-white"
              >
                <o-field class="is-flex-shrink-1 mr-5" :label="`${$t('resources.entity')} ID`">
                  <span class="value is-size-7">{{ element.entityId }}</span>
                </o-field>
                <o-field class="is-flex-shrink-1 mr-5" :label="$t('resources.entityGroup')">
                  <span class="value is-size-7">{{ element.entityGroup }}</span>
                </o-field>
                <o-field class="is-flex-shrink-1" :label="$t('resources.dataset')">
                  <span class="value is-size-7">
                    {{ readableDatasetName(element.datasetName) }}
                  </span>
                </o-field>
              </div>
            </div>
          </template>
        </Draggable>
      </div>
    </div>

    <div class="bottom">
      <MovButtons
        size="small"
        isPulledRight
        :modelValue="buttons"
        @save="saveChart"
        @cancel="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ColorInput from "@movici-flow-lib/components/ColorInput.vue";
import { useButtons } from "@movici-flow-lib/composables/useButtons";
import { useDraggable } from "@movici-flow-lib/composables/useDraggable";
import { MoviciError } from "@movici-flow-lib/errors";
import type { RGBAColor } from "@movici-flow-lib/types";
import { excludeKeys } from "@movici-flow-lib/utils";
import { snakeToSpaces, upperFirst } from "@movici-flow-lib/utils/filters";
import {
  ChartVisualizerInfo,
  ChartVisualizerItem,
} from "@movici-flow-lib/visualizers/VisualizerInfo";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import { computed, ref, watch, type Ref } from "vue";
import Draggable from "vuedraggable";

const props = defineProps<{
  modelValue: ChartVisualizerInfo;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: ChartVisualizerInfo): void;
}>();
const local = ref<ChartVisualizerInfo>();
const selectedAttributeName = computed(() => {
  return local.value?.attribute ?? "";
});

const showDetails = ref([]) as Ref<boolean[]>;
function hideAllDetails() {
  showDetails.value = Array.from({ length: props.modelValue?.items.length ?? 0 }, () => false);
}
watch(
  () => props.modelValue,
  (val) => {
    local.value = cloneDeep(val);
    hideAllDetails();
  },
  { immediate: true }
);

const hasPendingChanges = computed(() => {
  if (!props.modelValue || !local.value) return false;

  const value = excludeKeys(props.modelValue, ["id", "errors", "status"]),
    finalized = excludeKeys(local.value, ["id", "errors", "status"]);
  return !isEqual(finalized, value);
});

const disabledButtons = computed(() => ({
  save: !hasPendingChanges.value,
}));
const allButtons = useButtons(disabledButtons);
const buttons = [allButtons.save, allButtons.cancel];

const items = computed({
  get: () => local.value!.items,
  set: (val) => {
    local.value!.items = val;
  },
});

const { draggableEvents, draggableOptions, dragging, draggableChange } = useDraggable(
  items,
  "chart-items"
);
function onDrag(event: { moved: { oldIndex: number; newIndex: number } }) {
  draggableChange(event);
  hideAllDetails();
}
function itemKey(item: ChartVisualizerItem) {
  return `${item.datasetName}-${item.entityGroup}-${item.entityId}`;
}

function removeItem(index: number) {
  local.value?.items.splice(index);
  showDetails.value.splice(index);
}

function toggleDetails(idx: number) {
  showDetails.value = showDetails.value.map((val, i) => (idx === i ? !val : val));
}

function updateColor(idx: number, color: RGBAColor) {
  if (local.value) {
    local.value.items = local.value.items.map((config, i) => {
      return idx == i ? new ChartVisualizerItem({ ...config, color }) : config;
    });
  }
}

function readableDatasetName(name: string) {
  return upperFirst(snakeToSpaces(name));
}
function saveChart() {
  if (!local.value) {
    throw new MoviciError("Chart is invalid");
  }
  emit("update:modelValue", local.value);
}
</script>

<style scoped lang="scss">
.box {
  box-shadow: none;
  border-radius: 0;
  &.info {
    border-top: 1px solid $grey-lighter;
  }
  .header {
    .label {
      &.color {
        width: 54px;
      }
    }
  }
}
:deep(.field) {
  margin-bottom: 0.125em;
  .field-label {
    min-width: 80px;
  }
  .label {
    font-size: 0.75rem;
  }
  span {
    display: block;
  }
}

.chart-config {
  --visualizer-editor-bg-color: #{$white};
  position: fixed;
  left: calc(#{$left-menu-size + $menu-item-size});
  top: 0;
  width: 30vw;
  height: 100vh;
  background-color: var(--visualizer-editor-bg-color);
  box-shadow: inset 0 0 10px 0 rgba(0, 0, 0, 0.1);
  z-index: 2;
  padding: 0 24px;
  transition: transform 0.5s;
  header {
    padding-top: 24px;
    background-color: var(--visualizer-editor-bg-color);
    position: sticky;
    top: 0;
    z-index: 5;
  }
  .bottom {
    background: var(--visualizer-editor-bg-color);
    padding: 16px 0 24px 0;
  }
}
</style>
