<template>
  <WidgetContainer
    class="property-sidebar"
    collapsable
    :collapsed="sidebar.collapsed.value"
    @update:collapsed="sidebar.setCollapsed"
  >
    <template #collapse-title="{ collapsed }">
      <div class="is-flex is-flex-direction-row-reverse is-align-items-center is-clickable">
        <o-icon
          :title="collapsed ? 'Show property editor' : 'Hide property editor'"
          class="collapsed-icon"
          pack="far"
          :icon="collapsed ? 'edit' : 'minus-square'"
        />

        <div class="is-flex-grow-1" v-show="!collapsed">
          <div class="property-title is-flex is-align-items-baseline">
            <p class="label mb-0 mr-2">Properties of:</p>
            <span class="is-size-7">
              {{ groupLabel || "Property Editor" }}
            </span>
          </div>
          <p class="is-size-7 has-text-grey">
            {{ selectionLabel }}
          </p>
        </div>
      </div>
    </template>
    <template #collapse-content>
      <div class="sidebar-content mt-2">
        <PropertyEditor
          :entity="store.selectedEntity"
          :entity-group="store.entityGroup"
          :attributes="attributes"
          :selected-ids="store.selectedIds"
          :general-enums="generalEnums"
          :enum-names="enumNames"
          @change="onPropertyChange"
          @delete-attribute="onDeleteAttribute"
        />
      </div>
    </template>
  </WidgetContainer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEditorStore } from "@movici-flow-lib/stores/editor";
import { useDialog } from "@movici-flow-lib/baseComposables/useDialog";
import { useEditorSidebar } from "@movici-flow-lib/composables/useEditorSidebar";
import PropertyEditor from "./PropertyEditor.vue";
import { snakeToFriendly } from "@movici-flow-lib/utils/filters";
import WidgetContainer from "@movici-flow-lib/components/mapControls/WidgetContainer.vue";

const store = useEditorStore();
const sidebar = useEditorSidebar();
const { openDialog } = useDialog();

const groupLabel = computed(() => snakeToFriendly(store.entityGroup));

const attributes = computed<string[]>(() => {
  const group = store.entityGroup;
  if (!group) return [];
  const groupData = store.dataset?.data?.[group] as Record<string, unknown[]> | undefined;
  if (!groupData) return [];
  return Object.keys(groupData).filter((key) => !store.isAttributeDeleted(group, key));
});

const selectionLabel = computed(
  () => `${store.selectedIds.length} of ${store.entityCount(store.entityGroup)} selected`,
);

function onPropertyChange(prop: string, value: unknown) {
  if (!store.entityGroup || !store.selectedIds.length) return;
  store.updatePropertyForIds(store.entityGroup, store.selectedIds, prop, value);
}

function onDeleteAttribute(prop: string) {
  const group = store.entityGroup;
  if (!group) return;
  openDialog({
    title: "Delete attribute?",
    message:
      `Attribute '${prop}' will be removed from entity group '${group}'. ` +
      `You can undo this until the dataset is saved.`,
    variant: "danger",
    hasIcon: true,
    confirmButtonText: "Yes. Delete",
    onConfirm: () => store.deleteAttribute(group, prop),
  });
}

const generalEnums = computed<Record<string, string[]>>(() => {
  const g = store.dataset?.general as Record<string, unknown> | undefined;
  // Accepts "enums" as a lenient fallback
  const enums = (g?.["enum"] ?? g?.["enums"]) as Record<string, string[]> | undefined;
  return enums ?? {};
});

const enumNames = computed<Record<string, string>>(() => {
  // enum_name mapping lives in the dataset summary, which the editor doesn't load.
  // We apply a best-effort convention: an attribute maps to the enum
  // named after its last segment, e.g. "operational.power_source" -> general.enum["power_source"]
  const result: Record<string, string> = {};
  if (!store.entityGroup) return result;
  for (const key of attributes.value) {
    const suffix = key.split(".").pop() ?? key;
    if (generalEnums.value[suffix]) {
      result[key] = suffix;
    }
  }
  return result;
});
</script>

<style scoped lang="scss">
.property-sidebar {
  width: 360px;
}
.sidebar-content {
  max-height: 55vh;
  overflow-y: auto;
}
</style>
