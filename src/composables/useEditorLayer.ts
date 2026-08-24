import { computed } from "vue";
import { EditableGeoJsonLayer, ViewMode, SelectionLayer } from "@deck.gl-community/editable-layers";
import type { Layer } from "@deck.gl/core";
import { useEditorStore } from "../stores/editor";
import { MoviciColors, hexToColorTriple } from "@movici-flow-lib/visualizers/maps/colorMaps";
import type { Feature, FeatureCollection } from "geojson";

const VIEW_MODE = new ViewMode();
const HIGHLIGHT_COLOR: [number, number, number, number] = [255, 140, 0, 220];
const EDIT_HANDLE_COLOR: [number, number, number, number] = [255, 255, 255, 255];
const EDIT_HANDLE_OUTLINE_COLOR: [number, number, number, number] = [255, 140, 0, 255];

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

export function useEditorLayer() {
  const store = useEditorStore();

  const accessorCache = new Map<string, { getFillColor: unknown; getLineColor: unknown }>();
  const collectionCache = new Map<string, { features: Feature[]; collection: FeatureCollection }>();

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

        // Draw/delete/translate modes apply only to active group; other groups stay in view mode
        const isScopeMode = [
          "draw-point",
          "draw-line",
          "draw-polygon",
          "delete",
          "translate",
        ].includes(store.editModeKey);
        const layerMode =
          isScopeMode && groupName !== store.entityGroup ? VIEW_MODE : store.editMode;

        const { getFillColor, getLineColor } = accessorFor(
          groupName,
          groupFillColor,
          groupLineColor,
        );

        return new EditableGeoJsonLayer({
          id: `editable-${groupName}`,
          data: featureCollection,
          mode: layerMode,
          modeConfig: { formatTooltip: () => "" },
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

    return editableLayers;
  });

  return { layers };
}
