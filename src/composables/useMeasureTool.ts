import type { PickingInfo } from "@deck.gl/core";
import type { Feature } from "geojson";
import { computed, shallowRef, watch } from "vue";
import { useEditorStore } from "../stores/editor";
import { isMetricCRS, measureFeature, type Measurement } from "../utils/measure";

export interface MeasureTarget {
  groupName: string;
  id: number;
  pickInfo: PickingInfo; // used by DynamicDataView to place the popup
}

const MEASURABLE_TYPES = ["LineString", "Polygon"];

export function useMeasureTool() {
  const store = useEditorStore();
  const target = shallowRef<MeasureTarget | null>(null);

  function clear() {
    target.value = null;
  }

  function onClick(pickInfo?: PickingInfo) {
    const feature = pickInfo?.object as Feature | undefined;
    const id = feature?.properties?.__id as number | undefined;
    const groupName = pickInfo?.layer?.id.match(/^editable-(.+)$/)?.[1];
    if (
      !pickInfo ||
      id === undefined ||
      !groupName ||
      !MEASURABLE_TYPES.includes(feature?.geometry?.type ?? "")
    ) {
      return clear(); //
    }
    target.value = { groupName, id, pickInfo };
  }

  // Current WGS84 geometry, also used to highlight it on the map
  const feature = computed<Feature | null>(() => {
    const t = target.value;
    if (!t || !store.isGroupVisible(t.groupName)) return null;
    return store.wgs84Features[t.groupName]?.find((f) => f.properties?.__id === t.id) ?? null;
  });

  const measurement = computed<Measurement | null>(() => {
    const crs = store.dataset?.epsg_code;
    if (!feature.value || !isMetricCRS(crs)) return null;
    return measureFeature(feature.value, crs);
  });

  watch([target, measurement], ([t, m]) => {
    if (t && !m) clear();
  });
  // Leaving the tool  or reloading a dataset closes the popup
  watch(
    () => store.editModeKey,
    (mode) => {
      if (mode !== "measure") clear();
    },
  );
  watch(() => store.datasetUUID, clear);

  return { target, feature, measurement, onClick, clear };
}
