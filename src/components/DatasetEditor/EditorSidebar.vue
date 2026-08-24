<template>
  <aside class="editor-sidebar">
    <div class="sidebar-header p-3 border-bottom">
      <o-field :label="'Entity group'" label-class="is-size-7">
        <o-select
          v-model="selectedGroup"
          size="small"
          expanded
          :disabled="!store.entityGroupNames.length"
          placeholder="Select entity group"
        >
          <option v-for="name in store.entityGroupNames" :key="name" :value="name">
            {{ name }}
          </option>
        </o-select>
      </o-field>
      <o-field label="New entity group" label-class="is-size-7" class="mt-2 mb-0">
        <div class="is-flex is-align-items-center add-row">
          <o-input
            v-model="newGroupName"
            size="small"
            placeholder="entities"
            expanded
            :disabled="!store.dataset"
            @keyup.enter="onAddEntityGroup"
          />
          <o-select v-model="newGroupGeometry" size="small">
            <option value="point">point</option>
            <option value="linestring">line</option>
            <option value="polygon">polygon</option>
          </o-select>
          <o-button size="small" :disabled="!canAddGroup" @click="onAddEntityGroup">Add</o-button>
        </div>
      </o-field>
      <p v-if="addGroupError" class="is-size-7 has-text-danger mt-1">{{ addGroupError }}</p>
      <div class="is-size-7 has-text-grey mt-1">
        {{ entityCount }} entities
        <span v-if="modifiedCount > 0" class="has-text-warning-dark ml-2">
          ({{ modifiedCount }} modified)
        </span>
      </div>
      <o-field label="New attribute" label-class="is-size-7" class="mt-2 mb-0">
        <div class="is-flex is-align-items-center add-row">
          <o-input
            v-model="newAttrName"
            size="small"
            placeholder="attribute.name"
            expanded
            :disabled="!store.entityGroup"
            @keyup.enter="onAddAttribute"
          />
          <o-select v-model="newAttrType" size="small">
            <option value="number">number</option>
            <option value="string">string</option>
            <option value="boolean">boolean</option>
          </o-select>
          <o-button size="small" :disabled="!canAddAttribute" @click="onAddAttribute">
            Add
          </o-button>
        </div>
      </o-field>
      <p v-if="addAttrError" class="is-size-7 has-text-danger mt-1">{{ addAttrError }}</p>
    </div>
    <div class="sidebar-content p-3">
      <PropertyEditor
        :entity="store.selectedEntity"
        :entity-group="store.entityGroup"
        :general-enums="generalEnums"
        :enum-names="enumNames"
        @change="onPropertyChange"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useEditorStore } from "@movici-flow-lib/stores/editor";
import PropertyEditor from "./PropertyEditor.vue";
import type { GeometryType } from "@movici-flow-lib/utils/geoJsonBridge";

const store = useEditorStore();

const selectedGroup = computed({
  get: () => store.entityGroup,
  set: (val: string | null) => {
    if (val) store.selectEntityGroup(val);
  },
});

const newAttrName = ref("");
const newAttrType = ref<"number" | "string" | "boolean">("number");
const addAttrError = ref<string | null>(null);

const canAddAttribute = computed(() => !!store.entityGroup && newAttrName.value.trim().length > 0);

function onAddAttribute() {
  if (!store.entityGroup || !canAddAttribute.value) return;
  const name = newAttrName.value.trim();
  if (store.addAttribute(store.entityGroup, name, newAttrType.value)) {
    newAttrName.value = "";
    addAttrError.value = null;
  } else {
    addAttrError.value = `Cannot add attribute '${name}': name is reserved or already exists`;
  }
}

const newGroupName = ref("");
const newGroupGeometry = ref<GeometryType>("point");
const addGroupError = ref<string | null>(null);

const canAddGroup = computed(() => !!store.dataset?.data && newGroupName.value.trim().length > 0);

function onAddEntityGroup() {
  if (!canAddGroup.value) return;
  const name = newGroupName.value.trim();
  if (store.addEntityGroup(name, newGroupGeometry.value)) {
    newGroupName.value = "";
    addGroupError.value = null;
  } else {
    addGroupError.value = `Cannot add entity group '${name}': it already exists`;
  }
}

const entityCount = computed(() => {
  if (!store.dataset?.data || !store.entityGroup) return 0;
  const groupData = store.dataset.data[store.entityGroup] as Record<string, unknown[]> | undefined;
  return (groupData?.["id"] as unknown[])?.length ?? 0;
});

const modifiedCount = computed(() => {
  if (!store.entityGroup) return 0;
  return store.changes.get(store.entityGroup)?.size ?? 0;
});

const generalEnums = computed<Record<string, string[]>>(() => {
  const g = store.dataset?.general as Record<string, unknown> | undefined;
  // Accept "enums" as a lenient fallback
  const enums = (g?.["enum"] ?? g?.["enums"]) as Record<string, string[]> | undefined;
  return enums ?? {};
});

const enumNames = computed<Record<string, string>>(() => {
  // enum_name mapping lives in the dataset
  // summary, which the editor doesn't load.
  // We apply a Best-effort convention:
  // an attribute maps to the enum named after its last segment, e.g.
  // "operational.power_source" -> general.enum["power_source"]
  const result: Record<string, string> = {};
  if (!store.entityGroup) return result;
  const groupData = store.dataset?.data?.[store.entityGroup] as
    | Record<string, unknown[]>
    | undefined;
  if (!groupData) return result;
  for (const key of Object.keys(groupData)) {
    const suffix = key.split(".").pop() ?? key;
    if (generalEnums.value[suffix]) {
      result[key] = suffix;
    }
  }
  return result;
});

function onPropertyChange(prop: string, value: unknown) {
  if (!store.entityGroup || store.selectedId === null) return;
  store.updateProperty(store.entityGroup, store.selectedId, prop, value);
}
</script>

<style scoped lang="scss">
.editor-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-left: 1px solid $grey-lighter;
  background: white;

  .sidebar-header {
    border-bottom: 1px solid $grey-lighter;
    flex-shrink: 0;
  }
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
  }
  .add-row {
    gap: 0.25rem;
  }
}
</style>
