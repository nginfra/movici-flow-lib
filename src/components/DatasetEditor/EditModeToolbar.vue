<template>
  <div class="edit-mode-toolbar">
    <o-tooltip v-for="mode in visibleModes" :key="mode.key" :label="mode.label" position="right">
      <o-button
        :variant="store.editModeKey === mode.key ? 'primary' : 'white'"
        size="small"
        :icon-left="mode.icon"
        icon-pack="fas"
        @click="store.setEditMode(mode.key)"
        class="mode-btn"
      />
    </o-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEditorStore } from "@movici-flow-lib/stores/editor";
import type { EditModeKey } from "@movici-flow-lib/stores/editor";

const store = useEditorStore();

const baseModes: { key: EditModeKey; label: string; icon: string }[] = [
  { key: "view", label: "Select", icon: "mouse-pointer" },
  { key: "select-rectangle", label: "Rectangle select", icon: "vector-square" },
  { key: "modify", label: "Edit vertices", icon: "project-diagram" },
  { key: "translate", label: "Move feature", icon: "arrows-alt" },
  { key: "delete", label: "Delete feature", icon: "trash" },
];

const drawModes: { key: EditModeKey; label: string; icon: string; geomType: string }[] = [
  { key: "draw-point", label: "Draw point", icon: "map-pin", geomType: "point" },
  { key: "draw-line", label: "Draw line", icon: "route", geomType: "linestring" },
  { key: "draw-polygon", label: "Draw polygon", icon: "draw-polygon", geomType: "polygon" },
];

const visibleModes = computed(() => {
  const geomType = store.currentGroupGeometryType;
  const matchingDrawModes = geomType ? drawModes.filter((m) => m.geomType === geomType) : [];
  return [...baseModes, ...matchingDrawModes];
});
</script>

<style scoped lang="scss">
.edit-mode-toolbar {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .mode-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
