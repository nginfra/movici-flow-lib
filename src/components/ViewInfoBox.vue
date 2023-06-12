<template>
  <div class="current-visualization is-flex is-align-items-flex-end">
    <ViewLoaderModal
      @loadView="$emit('loadView', $event)"
      :views="store.views"
      @close="loadModal = false"
      v-model:active="loadModal"
      width="400"
    />
    <div class="info is-flex-grow-1">
      <label class="is-size-7 is-block">
        {{ $t("flow.visualization.infoLabel") }}
      </label>
      <span class="is-flex is-align-items-center is-flex-grow-1">
        <div class="is-flex-grow-1 field">
          <o-input
            class="view-name-input"
            :modelValue="name"
            @update:modelValue="$emit('update:name', $event)"
          />
        </div>

        <slot name="quickSave"></slot>
        <MovKebabMenu
          :modelValue="actions"
          @loadViewDialog="loadViewDialog"
          @saveView="$emit('saveView')"
          @saveViewAsNew="$emit('saveViewAsNew')"
          @deleteView="$emit('deleteView')"
          @close="openMenu = false"
        />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFlowStore } from "@movici-flow-common/stores/flow";
import type { ActionItem } from "@movici-flow-common/types";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import ViewLoaderModal from "./ViewLoaderModal.vue";

const { t } = useI18n();
const store = useFlowStore();

defineProps<{
  name: string;
}>();

const loadModal = ref(false);
const openMenu = ref(false);

async function loadViewDialog() {
  await store.loadViews();
  loadModal.value = true;
}
const actions: ActionItem[] = [
  {
    label: t("actions.addNew") + " " + t("resources.view"),
    icon: "file",
    iconPack: "far",
    event: "resetView",
  },
  {
    label: t("actions.load") + " " + t("resources.views") + "...",
    icon: "map",
    iconPack: "far",
    event: "loadViewDialog",
  },
  {
    label: t("actions.save") + " " + t("resources.view"),
    icon: "fa-mov-save",
    iconPack: "fak",
    event: "saveView",
  },
  {
    label: t("actions.saveAsNew") + "...",
    icon: "fa-mov-save",
    iconPack: "fak",
    event: "saveViewAsNew",
  },
  {
    label: "" + t("actions.delete") + " " + t("resources.view"),
    icon: "trash",
    iconPack: "far",
    event: "deleteView",
    variant: "danger",
  },
];
</script>

<style scoped lang="scss">
.info {
  --height-name: 1.75rem;
  .field {
    margin: 0 8px 0 0;

    :deep(.view-name-input) {
      height: var(--height-name);
      font-weight: 700;
      padding: 0.375rem;

      &:focus {
        font-weight: 300;
      }
    }
  }
}
</style>
