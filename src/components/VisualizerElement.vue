<template>
  <div class="group-picker visualizer-element is-flex is-flex-direction-column is-relative">
    <div class="header">
      <slot name="header" v-bind="{ toggleSummary, isOpen }"></slot>
      <template v-if="modelValue">
        <span class="grip mr-1" v-if="showOnHeader('grip')">
          <span class="icon is-small fa-stack">
            <i class="far fa-ellipsis-v"></i>
            <i class="far fa-ellipsis-v"></i>
          </span>
        </span>
        <label
          v-if="showOnHeader('label')"
          class="is-flex-grow-1 label"
          @click="toggleSummary"
          :class="{ 'not-ready': (progress ?? 0) < 100 }"
        >
          <span class="is-block is-size-6-half text-ellipsis" :title="modelValue.name">{{ modelValue.name }}</span>
        </label>
        <span v-if="showOnHeader('errors') && errors.length" class="errors mr-2">
          <o-icon
            :title="errors.join('\n')"
            :variant="errorVariant"
            size="small"
            pack="far"
            icon="exclamation-triangle"
          />
        </span>
        <span
          v-if="showOnHeader('visibility')"
          @click="toggleVisibility()"
          class="visibility mr-1"
          :class="{ enabled: modelValue.visible }"
        >
          <o-icon
            size="small"
            pack="fak"
            :icon="modelValue.visible ? 'fa-visibility' : 'fa-visibility-off'"
          />
        </span>
      </template>
      <MovKebabMenu
        v-if="showOnHeader('more')"
        :modelValue="filteredActions"
        @edit="emit('edit')"
        @reload="emit('reload')"
        @duplicate="emit('duplicate')"
        @export="emit('export')"
        @delete="emit('delete')"
      />
    </div>
    <VisualizerSummary
      v-if="modelValue"
      :modelValue="modelValue"
      :progress="progress"
      :show="isOpen"
    />
    <MovProgress v-if="showLoader" :class="{ fade: (progress ?? 0) >= 100 }" :value="progress" />
  </div>
</template>

<script setup lang="ts">
import type { ActionItem } from "@movici-flow-lib/types";
import StatusTracker from "@movici-flow-lib/utils/StatusTracker";
import { ComposableVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import { computed, ref, watch } from "vue";
import VisualizerSummary from "./VisualizerSummary.vue";

type HeaderItem = "grip" | "label" | "errors" | "visibility" | "more";
type VisualizerAction = "edit" | "reload" | "duplicate" | "delete" | "export";
const actions: Record<VisualizerAction, ActionItem> = {
  edit: {
    icon: "edit",
    iconPack: "far",
    label: "Edit",
    event: "edit",
  },
  reload: {
    icon: "redo",
    iconPack: "fas",
    label: "Reload",
    event: "reload",
    variant: "warning",
  },
  duplicate: {
    icon: "clone",
    iconPack: "far",
    label: "Duplicate",
    event: "duplicate",
  },
  delete: {
    icon: "trash",
    iconPack: "far",
    label: "Delete",
    event: "delete",
    variant: "danger",
  },
  export: {
    icon: "file-download",
    iconPack: "far",
    label: "Export",
    event: "export",
  },
};
const props = withDefaults(
  defineProps<{
    modelValue?: ComposableVisualizerInfo;
    headerItems?: HeaderItem[];
    actionButtons?: null | VisualizerAction[];
    tooltipPosition?: string;
    tooltipActive?: boolean;
  }>(),
  {
    headerItems: () => ["grip", "label", "visibility", "more", "errors"],
    actionButtons: null,
    tooltipPosition: "is-bottom",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", val: ComposableVisualizerInfo): void;
  (e: "edit"): void;
  (e: "reload"): void;
  (e: "duplicate"): void;
  (e: "delete"): void;
  (e: "export"): void;
}>();
const progress = ref<number>();
const isOpen = ref(false);

const filteredActions = computed<ActionItem[]>(() => {
  if (props.actionButtons) {
    return props.actionButtons.map((event) => actions[event]).filter((r) => r != null);
  }
  return Object.values(actions);
});

const showLoader = computed(() => {
  return !errors.value.length && typeof progress.value === "number";
});

const errors = computed(() => {
  return props.modelValue ? Object.values(props.modelValue.errors) : [];
});

const errorVariant = computed(() => {
  // should we classify error by colors?
  return "warning";
});

function toggleSummary() {
  isOpen.value = !isOpen.value;
}

function toggleVisibility(force?: boolean) {
  if (props.modelValue)
    emit(
      "update:modelValue",
      Object.assign(new ComposableVisualizerInfo(props.modelValue), {
        visible: force ?? !props.modelValue?.visible,
      }),
    );
}

function showOnHeader(button: HeaderItem) {
  return props.headerItems.includes(button);
}

watch(
  () => props.modelValue,
  () => {
    if (props.modelValue) {
      if (props.modelValue.status) {
        // eslint-disable-next-line vue/no-mutating-props
        props.modelValue.status.onProgress = (val) => (progress.value = val);
      } else {
        // eslint-disable-next-line vue/no-mutating-props
        props.modelValue.status = new StatusTracker({
          tasks: {
            initData: 20,
            updates: 80,
          },
          onProgress: (val) => (progress.value = val),
        });
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
$summary-bg: $white;
$container-bg: $white-ter;
.visualizer-element {
  background-color: $container-bg;
  .header {
    background-color: $container-bg;
    width: 100%;
    .label {
      span {
        max-width: 155px;
      }
      &.not-ready {
        font-style: italic;
        font-weight: bold;
        color: $grey-dark !important;
      }
      cursor: pointer;
      font-size: 16px;
      color: $black;
    }
    & > span {
      display: flex;
      align-items: center;
      padding: 4px;
      &:hover {
        @include hover-grey-bgcolor;
      }
      &.visibility {
        font-size: 20px;
        color: $grey;
        &.enabled {
          color: $primary;
        }
      }
      &.grip {
        padding-left: 0;
        padding-right: 0;
      }
      &.edit,
      &.open,
      &.export,
      &.visibility {
        @include border-radius;
        cursor: pointer;
      }
    }
  }
  :deep(.progress-wrapper) {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    &.fade {
      transition: all 0.5s;
      transition-delay: 0.5s;
      opacity: 0;
    }
    .progress {
      height: 0.25em;
    }
  }
}
</style>
