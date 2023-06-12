import type { RefLike } from "@movici-flow-common/types";
import type mapboxgl from "mapbox-gl";
import { ref, unref, type Ref } from "vue";

export function useMapLayer(map: RefLike<mapboxgl.Map | undefined>) {
  const ids = ref(new Set()) as Ref<Set<string>>;
  const sources = ref(new Set()) as Ref<Set<string>>;

  function addSources(map: mapboxgl.Map, mapSources: Record<string, mapboxgl.AnySourceData>) {
    for (const key of Object.keys(mapSources)) {
      map.addSource(key, mapSources[key]);
      sources.value.add(key);
    }
  }

  function removeSources(map: mapboxgl.Map) {
    for (const source of sources.value) {
      try {
        map.removeSource(source);
      } catch (e) {
        console.error(e);
      }
    }
  }

  function addLayer(map: mapboxgl.Map, layer: mapboxgl.AnyLayer) {
    ids.value.add(layer.id);
    map.addLayer(layer);
  }
  function removeLayers(map: mapboxgl.Map) {
    for (const id of ids.value) {
      try {
        map.removeLayer(id);
      } catch (e) {
        console.error(e);
      }
    }
  }
  function mount({
    layer,
    sources,
  }: {
    layer: mapboxgl.AnyLayer;
    sources?: Record<string, mapboxgl.AnySourceData>;
  }) {
    const theMap = unref(map);
    if (!theMap) return;

    const attach = () => {
      if (sources) {
        addSources(theMap, sources);
      }

      addLayer(theMap, layer);
      theMap.off("idle", attach);
    };
    theMap.on("idle", attach);
  }
  function unmount() {
    const theMap = unref(map);
    if (!theMap) return;
    removeLayers(theMap);
    removeSources(theMap);
  }
  return {
    ids,
    sources,
    mount,
    unmount,
  };
}
