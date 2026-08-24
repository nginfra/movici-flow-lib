<template>
  <div class="editor-view" @keydown="onKeyDown" tabindex="-1">
    <EditorToolbar />
    <div class="editor-body">
      <div class="editor-map">
        <Deck :layers="layers" :camera="camera" :basemap="basemap" @update:camera="camera = $event">
          <template #control-left="{ onViewstateChange }">
            <MapControlNavigation
              :model-value="camera"
              :init-camera="camera"
              @update:model-value="onViewstateChange($event)"
            />
            <MapControlBaseMap :model-value="basemap" @update:model-value="basemap = $event" />
            <EditModeToolbar />
          </template>
          <!-- Hack to leave click registration 'on' because Deck doesn't provide direct event access-->
          <template #control-zero="{ on }">
            <span :data-on="registerOn(on)" style="display: none" />
          </template>
        </Deck>
      </div>
      <EditorSidebar class="editor-sidebar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useEditorStore } from "../stores/editor";
import { useEditorLayer } from "../composables/useEditorLayer";
import { transformBBox } from "../crs";
import type { DeckCamera, DeckEventCallback, ShortDataset } from "../types";
import { useMoviciSettings } from "../baseComposables/useMoviciSettings";
import Deck from "../components/Deck.vue";
import MapControlNavigation from "../components/mapControls/MapControlNavigation.vue";
import MapControlBaseMap from "../components/mapControls/MapControlBaseMap.vue";
import EditorToolbar from "./DatasetEditor/EditorToolbar.vue";
import EditorSidebar from "./DatasetEditor/EditorSidebar.vue";
import EditModeToolbar from "./DatasetEditor/EditModeToolbar.vue";
import { useReactiveSummary } from "../composables/useReactiveSummary.ts";

const props = defineProps<{
  modelValue: ShortDataset;
}>();

const store = useEditorStore();

const { layers } = useEditorLayer();

const DEFAULT_VIEWSTATE = useMoviciSettings().settings.defaultViewState;
const camera = ref<DeckCamera>({ viewState: DEFAULT_VIEWSTATE });
const basemap = ref("mapbox://styles/mapbox/light-v10"); // TODO: replace with basemap selector

// Registering a click handler on the Deck component's 'on' method.
let _on: ((event: "click", callbacks: Record<string, DeckEventCallback>) => void) | null = null;

function registerOn(on: (event: "click", callback: Record<string, DeckEventCallback>) => void) {
  if (_on === on) return "";
  _on = on;
  on("click", {
    editorClick: (payload) => {
      const info = payload.pickInfo; //info.object is a GeoJSON feature with properties.__id
      const obj = info?.object as any;
      const entityId = obj?.properties?.__id;
      if (entityId !== undefined && info != null) {
        const layerId: string = (info as any).layer?.id ?? "";

        const groupMatch = layerId.match(/^editable-(.+)$/);
        const clickedGroup = groupMatch?.[1] ?? store.entityGroup ?? "";
        if (clickedGroup && clickedGroup !== store.entityGroup) {
          store.selectEntityGroup(clickedGroup);
        }
        if (store.editModeKey === "delete") {
          store.deleteEntity(clickedGroup, entityId as number);
        } else {
          store.selectEntity(entityId as number);
        }
      } else {
        store.clearSelection();
      }
    },
  });
  return "";
}

function onKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === "z") {
    e.preventDefault();
    store.undo();
  } else if (e.ctrlKey && e.key === "y") {
    e.preventDefault();
    store.redo();
  } else if (e.key === "Escape") {
    store.setEditMode("view");
  }
}

//  Expand a WGS84 bbox to at least minDeg
// Controls the inital zoom extend and level depending on the extent of the dataset
function padBBox(
  bbox: [number, number, number, number],
  minDeg = 0.05,
): [number, number, number, number] {
  const [west, south, east, north] = bbox;
  const cx = (west + east) / 2;
  const cy = (north + south) / 2;
  const halfWidth = Math.max((east - west) / 2, minDeg / 2);
  const halfHeight = Math.max((north - south) / 2, minDeg / 2);
  return [cx - halfWidth, cy - halfHeight, cx + halfWidth, cy + halfHeight];
}

async function loadAndInit(uuid: string) {
  // Only loads a single dataset. loadDataset also ensures the projection and
  // builds the wgs84 features.
  await store.loadDataset(uuid);
  // If a new dataset is requested while loading: abandon stale camera update.
  if (props.modelValue.uuid !== uuid) return;
  if (store.boundingBox) {
    const rawBbox = transformBBox(store.boundingBox, store.dataset?.epsg_code);
    const bbox = padBBox(rawBbox);
    const cam = { bbox: { coords: bbox, fillRatio: 0.7 } };
    camera.value = cam;
  }
}

onMounted(async () => {
  await loadAndInit(props.modelValue.uuid);
});

watch(
  () => props.modelValue.uuid,
  async (uuid) => {
    await loadAndInit(uuid);
  },
);
</script>

<style scoped lang="scss">
.editor-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  outline: none;
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-map {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.editor-sidebar {
  width: 360px;
  min-width: 280px;
  max-width: 480px;
  flex-shrink: 0;
}
</style>
