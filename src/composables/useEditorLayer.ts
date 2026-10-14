import { computed, watch, type Ref } from "vue";
import {
  EditableGeoJsonLayer,
  ViewMode,
  SelectionLayer,
  DrawPolygonMode,
} from "@deck.gl-community/editable-layers";
import type { Layer } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { ACTIVE_LAYER_MODES, DRAW_MODES, NO_SNAP_TARGETS, useEditorStore } from "../stores/editor";
import { SnappingEditableGeoJsonLayer } from "../visualizers/layers/SnappingEditableGeoJsonLayer";
import { SNAP_TOLERANCE_PX } from "../utils/snapping";
import { MoviciColors, hexToColorTriple } from "@movici-flow-lib/visualizers/maps/colorMaps";
import type { Feature, FeatureCollection } from "geojson";

const VIEW_MODE = new ViewMode();
const HIGHLIGHT_COLOR: [number, number, number, number] = [255, 140, 0, 220];
const EDIT_HANDLE_COLOR: [number, number, number, number] = [255, 255, 255, 255];
const EDIT_HANDLE_OUTLINE_COLOR: [number, number, number, number] = [255, 140, 0, 255];
const SELECTION_FILL_COLOR: [number, number, number, number] = [100, 160, 220, 40];
const SELECTION_LINE_COLOR: [number, number, number, number] = [100, 160, 220, 200];
const [mr, mg, mb] = hexToColorTriple(MoviciColors.TEAL);
const [cr, cg, cb] = hexToColorTriple(MoviciColors.VERY_DARK_GREY);
const MEASURE_HIGHLIGHT_FILL_COLOR: [number, number, number, number] = [mr, mg, mb, 70];
const MEASURE_HIGHLIGHT_LINE_COLOR: [number, number, number, number] = [mr, mg, mb, 255];
const MEASURE_HIGHLIGHT_CASING_COLOR: [number, number, number, number] = [cr, cg, cb, 220];
const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection" as const, features: [] };

const ENTITY_GROUP_PALETTE = [
  MoviciColors.GREEN,
  MoviciColors.BLUE,
  MoviciColors.RED,
  MoviciColors.PURPLE,
  MoviciColors.ORANGE,
  MoviciColors.YELLOW,
  MoviciColors.BROWN,
  MoviciColors.LIGHT_GREY,
];

type RGBA = [number, number, number, number];

export function useEditorLayer(highlightedFeature?: Readonly<Ref<Feature | null>>) {
  const store = useEditorStore();

  const accessorCache = new Map<string, { getFillColor: unknown; getLineColor: unknown }>();
  const collectionCache = new Map<string, { features: Feature[]; collection: FeatureCollection }>();
  const selectPolygonMode = new DrawPolygonMode();

  watch(
    // Discards an abandoned unfinished selection polygon when changing tool
    () => store.editModeKey,
    (mode) => {
      if (mode !== "select-polygon") selectPolygonMode.resetClickSequence();
    },
  );

  function accessorFor(groupName: string, fill: RGBA, line: RGBA) {
    let cached = accessorCache.get(groupName);
    if (!cached) {
      cached = {
        getFillColor: (_f: unknown, isSelected: boolean) => (isSelected ? HIGHLIGHT_COLOR : fill),
        getLineColor: (_f: unknown, isSelected: boolean) => (isSelected ? HIGHLIGHT_COLOR : line),
      };
      accessorCache.set(groupName, cached);
    }
    return cached;
  }

  function featureCollectionFor(groupName: string, features: Feature[]): FeatureCollection {
    const cached = collectionCache.get(groupName);
    if (cached?.features === features) return cached.collection;
    const collection = { type: "FeatureCollection" as const, features };
    collectionCache.set(groupName, { features, collection });
    return collection;
  }

  const layers = computed<Layer[]>(() => {
    if (!store.dataset?.data) return [];

    const editableLayers: Layer[] = Object.entries(store.dataset.data).map(
      ([groupName, groupDataRaw], idx) => {
        const [r, g, b] = hexToColorTriple(
          ENTITY_GROUP_PALETTE[idx % ENTITY_GROUP_PALETTE.length]!,
        );
        const groupFillColor: [number, number, number, number] = [r, g, b, 180];
        const groupLineColor: [number, number, number, number] = [r, g, b, 255];

        const groupData = groupDataRaw as Record<string, unknown[]>;
        const ids = (groupData["id"] as number[]) ?? [];

        // use WGS84 features if available, otherwise fallback to empty feature collection
        const features = store.wgs84Features[groupName] ?? [];
        const featureCollection = featureCollectionFor(groupName, features);

        // Map entity id to feature index for selection (single selection and multi-selection)
        const selectedIndexes: number[] = [];
        if (store.entityGroup === groupName) {
          if (store.multiSelectedIds.length > 0) {
            for (const id of store.multiSelectedIds) {
              const index = ids.indexOf(id);
              if (index !== -1) selectedIndexes.push(index);
            }
          } else if (store.selectedId !== null) {
            const index = ids.indexOf(store.selectedId);
            if (index !== -1) selectedIndexes.push(index);
          }
        }

        const isScopeMode = ACTIVE_LAYER_MODES.includes(store.editModeKey);
        const layerMode =
          isScopeMode && groupName !== store.entityGroup ? VIEW_MODE : store.editMode;

        const { getFillColor, getLineColor } = accessorFor(
          groupName,
          groupFillColor,
          groupLineColor,
        );

        return new SnappingEditableGeoJsonLayer({
          id: `editable-${groupName}`,
          visible: store.isGroupVisible(groupName),
          data: featureCollection,
          mode: layerMode,
          modeConfig: store.editModeConfig,
          selectedFeatureIndexes: selectedIndexes,
          pickable: true,
          getFillColor: getFillColor as any,
          getLineColor: getLineColor as any,
          getLineWidth: 3,
          lineWidthUnits: "pixels",
          getRadius: 6,
          pointRadiusMinPixels: 6,
          pointRadiusMaxPixels: 6,
          // Edit Pointer/Handle style
          getEditHandlePointColor: EDIT_HANDLE_COLOR,
          getEditHandlePointOutlineColor: EDIT_HANDLE_OUTLINE_COLOR,
          editHandlePointOutline: true,
          editHandlePointStrokeWidth: 2,
          // Only the active group's layer snaps; the others get no targets
          snapTargets: groupName === store.entityGroup ? store.snapTargets : NO_SNAP_TARGETS,
          snapTypes: store.snapTypes,
          snapTolerance: SNAP_TOLERANCE_PX,
          snapTrigger: DRAW_MODES.includes(store.editModeKey) ? "pointer" : "drag",
          //Callback
          onEdit: ((editAction: any) => {
            const { updatedData, editType, editContext } = editAction;
            const featureIndexes: number[] = editContext?.featureIndexes ?? [];
            if (editType === "addFeature") {
              const newFeatureIndx: number = featureIndexes[0] ?? updatedData.features.length - 1;
              const newFeature = updatedData.features[newFeatureIndx];
              if (newFeature) {
                store.addEntity(groupName, newFeature);
              }
            } else {
              store.onGeometryEdit(groupName, updatedData.features, featureIndexes, editType);
            }
          }) as any,
          updateTriggers: {
            getFillColor: [
              store.selectedId,
              store.multiSelectedIds,
              store.entityGroup === groupName,
            ],
            getLineColor: [
              store.selectedId,
              store.multiSelectedIds,
              store.entityGroup === groupName,
            ],
            data: [store.wgs84Features[groupName]],
            mode: [store.editMode, store.entityGroup],
            modeConfig: [store.editModeKey],
          },
        } as any);
      },
    );

    // Add a selection layer on top when multiple selection mode is on
    // User draws a rectangle to select multiple features
    if (store.editModeKey === "select-rectangle" && store.entityGroup) {
      editableLayers.push(
        new SelectionLayer({
          id: "editor-selection",
          selectionType: "rectangle",
          layerIds: [`editable-${store.entityGroup}`],
          onSelect: ({ pickingInfos }: { pickingInfos: any[] }) => {
            const ids = pickingInfos
              .map((info) => info.object?.properties?.__id as number | undefined)
              .filter((id): id is number => id !== undefined);
            store.setMultiSelection(ids);
          },

          getTentativeFillColor: () => [100, 160, 220, 40] as [number, number, number, number],
          getTentativeLineColor: () => [100, 160, 220, 200] as [number, number, number, number],
          lineWidthMinPixels: 1,
        } as any),
      );
    }
    // User draws a polygon in and around multiple features.
    if (store.editModeKey === "select-polygon" && store.entityGroup) {
      editableLayers.push(
        new EditableGeoJsonLayer({
          id: "editor-selection-polygon",
          data: EMPTY_FEATURE_COLLECTION,
          mode: selectPolygonMode,
          modeConfig: { preventOverlappingLines: true },
          selectedFeatureIndexes: [],
          pickable: true,
          getTentativeFillColor: () => SELECTION_FILL_COLOR,
          getTentativeLineColor: () => SELECTION_LINE_COLOR,
          getTentativeLineWidth: () => 2,
          lineWidthMinPixels: 1,
          getEditHandlePointColor: EDIT_HANDLE_COLOR,
          getEditHandlePointOutlineColor: SELECTION_LINE_COLOR,
          editHandlePointOutline: true,
          editHandlePointStrokeWidth: 2,
          onEdit: ((editAction: any) => {
            if (editAction.editType !== "addFeature") return;
            const ring = editAction.updatedData.features.at(-1)?.geometry?.coordinates?.[0];
            if (ring) store.selectInPolygon(ring);
          }) as any,
        } as any),
      );
    }
    const highlighted = highlightedFeature?.value;
    if (highlighted) {
      const data = [highlighted];
      editableLayers.push(
        new GeoJsonLayer({
          id: "editor-measure-highlight-casing",
          data,
          pickable: false,
          filled: false,
          getLineColor: MEASURE_HIGHLIGHT_CASING_COLOR,
          getLineWidth: 7,
          lineWidthUnits: "pixels",
          lineCapRounded: true,
          lineJointRounded: true,
        }),
        new GeoJsonLayer({
          id: "editor-measure-highlight",
          data,
          pickable: false,
          getFillColor: MEASURE_HIGHLIGHT_FILL_COLOR,
          getLineColor: MEASURE_HIGHLIGHT_LINE_COLOR,
          getLineWidth: 4,
          lineWidthUnits: "pixels",
          lineCapRounded: true,
          lineJointRounded: true,
        }),
      );
    }
    return editableLayers;
  });

  return { layers };
}
