<template>
  <div class="edit-mode-toolbar">
    <o-tooltip
      v-for="mode in visibleModes"
      :key="mode.key"
      :label="tooltipFor(mode)"
      position="right"
    >
      <o-button
        :variant="store.editModeKey === mode.key ? 'primary' : 'white'"
        size="small"
        :icon-left="mode.icon"
        icon-pack="fas"
        :disabled="isDisabled(mode.key)"
        @click="store.setEditMode(mode.key)"
        class="mode-btn"
      />
    </o-tooltip>
    <hr class="toolbar-divider" />
    <o-tooltip :label="store.snappingEnabled ? 'Snapping on' : 'Snapping off'" position="right">
      <o-button
        :variant="store.snappingEnabled ? 'primary' : 'white'"
        size="small"
        icon-left="magnet"
        icon-pack="fas"
        @click="store.setSnappingEnabled(!store.snappingEnabled)"
        class="mode-btn"
      />
    </o-tooltip>
    <template v-if="store.snappingEnabled">
      <o-tooltip
        v-for="snapType in snapTypeButtons"
        :key="snapType.type"
        :label="snapType.label"
        position="right"
      >
        <o-button
          :variant="store.snapTypes.includes(snapType.type) ? 'info' : 'white'"
          size="small"
          :icon-left="snapType.icon"
          icon-pack="fas"
          @click="store.toggleSnapType(snapType.type)"
          class="mode-btn"
        />
      </o-tooltip>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ACTIVE_GROUP_MODES, useEditorStore } from "@movici-flow-lib/stores/editor";
import type { EditModeKey } from "@movici-flow-lib/stores/editor";
import type { SnapType } from "@movici-flow-lib/utils/snapping";
import { isMetricCRS } from "@movici-flow-lib/utils/measure";
import { determineCRS } from "@movici-flow-lib/crs";

const store = useEditorStore();

const baseModes: {
  key: EditModeKey;
  label: string;
  icon: string;
}[] = [
  { key: "view", label: "Select", icon: "mouse-pointer" },
  { key: "select-rectangle", label: "Select by rectangle", icon: "square" },
  { key: "select-polygon", label: "Select by area", icon: "vector-square" },
  { key: "modify", label: "Edit vertices", icon: "project-diagram" },
  { key: "translate", label: "Move feature", icon: "arrows-alt" },
  { key: "delete", label: "Delete feature", icon: "trash" },
  { key: "measure", label: "Measure length / area", icon: "ruler-combined" },
];

const drawModes: { key: EditModeKey; label: string; icon: string; geomType: string }[] = [
  { key: "draw-point", label: "Draw point", icon: "map-pin", geomType: "point" },
  { key: "draw-line", label: "Draw line", icon: "route", geomType: "linestring" },
  { key: "draw-polygon", label: "Draw polygon", icon: "draw-polygon", geomType: "polygon" },
];

const snapTypeButtons: { type: SnapType; label: string; icon: string }[] = [
  { type: "vertex", label: "Snap to vertex", icon: "circle" },
  { type: "segment", label: "Snap to segment", icon: "minus" },
  { type: "endpoint", label: "Snap to endpoint", icon: "dot-circle" },
];

const measureSupported = computed(
  () => store.projectionReady && isMetricCRS(store.dataset?.epsg_code),
);

const activeGroupHidden = computed(
  () => !!store.entityGroup && !store.isGroupVisible(store.entityGroup),
);

function needsVisibleGroup(key: EditModeKey) {
  return activeGroupHidden.value && ACTIVE_GROUP_MODES.includes(key);
}

function isDisabled(key: EditModeKey) {
  return (key === "measure" && !measureSupported.value) || needsVisibleGroup(key);
}

function tooltipFor(mode: { key: EditModeKey; label: string }) {
  if (!isDisabled(mode.key)) return mode.label;
  if (needsVisibleGroup(mode.key)) return `${mode.label} (Turn on active entity group)`;
  return `Measuring needs a projected CRS in metres (dataset: ${determineCRS(store.dataset?.epsg_code)})`;
}

const visibleModes = computed(() => {
  const geomType = store.currentGroupGeometryType;
  const matchingDrawModes = geomType ? drawModes.filter((m) => m.geomType === geomType) : [];
  return [...matchingDrawModes, ...baseModes];
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

  .toolbar-divider {
    width: 24px;
    height: 1px;
    margin: 2px 4px;
    background-color: $grey-lighter;
  }
}
</style>
