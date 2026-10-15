<template>
  <EditorFormModal
    title="New entity group"
    :can-confirm="canAdd"
    :submit="onSubmit"
    @close="emit('close')"
  >
    <o-field label="Name" label-class="is-size-7" class="mb-2">
      <o-input
        ref="nameInput"
        v-model="name"
        size="small"
        placeholder="entity group name"
        expanded
      />
    </o-field>
    <o-field label="Geometry type" label-class="is-size-7" class="mb-2">
      <o-select v-model="geometryType" size="small">
        <option value="point">point</option>
        <option value="linestring">line</option>
        <option value="polygon">polygon</option>
      </o-select>
    </o-field>
  </EditorFormModal>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useEditorStore } from "@movici-flow-lib/stores/editor";
import type { GeometryType } from "@movici-flow-lib/utils/geoJsonBridge";
import EditorFormModal from "./EditorFormModal.vue";

const emit = defineEmits<{ (e: "close"): void }>();
const store = useEditorStore();
const name = ref("");
const geometryType = ref<GeometryType>("point");
const nameInput = ref<{ focus(): void } | null>(null);

const canAdd = computed(() => !!store.dataset?.data && name.value.trim().length > 0);
onMounted(() => nameInput.value?.focus());

function onSubmit(): string | null {
  const groupName = name.value.trim();
  return store.addEntityGroup(groupName, geometryType.value)
    ? null
    : `Cannot add entity group '${groupName}'. Is the group name unique?`;
}
</script>
