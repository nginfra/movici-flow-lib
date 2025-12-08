import type { RefLike } from "@movici-flow-lib/types";
import type { LayerSpecification, SourceSpecification } from "mapbox-gl";
import { ref, unref, type Ref } from "vue";

export function useMapLayer(map: RefLike<mapboxgl.Map | undefined>) {
  const ids = ref(new Set()) as Ref<Set<string>>;
  const sources = ref(new Set()) as Ref<Set<string>>;

  function addSources(map: mapboxgl.Map, mapSources: Record<string, SourceSpecification>) {
    for (const [key, entry] of Object.entries(mapSources)) {
      map.addSource(key, entry);
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

  function addLayer(map: mapboxgl.Map, layer: LayerSpecification) {
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
    layer: LayerSpecification;
    sources?: Record<string, SourceSpecification>;
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
