import type { ControllerOptions } from "@deck.gl/core/controllers/controller";
import type { BoundingBox } from "@movici-flow-lib/crs";
import { usePopupStore } from "@movici-flow-lib/stores/popup";
import type { Layer } from "deck.gl";
import { ref, type Ref } from "vue";

export function useDeckGL<D = unknown>() {
  const popup = usePopupStore();
  popup.reset();

  return {
    deck: ref<{ zoomToBBox(bbox: BoundingBox, ratio?: number): void } | null>(null),
    basemap: ref("mapbox://styles/mapbox/light-v10"),
    controller: ref<ControllerOptions>(),
    layers: ref([]) as Ref<Layer<D>[]>,
    popup,
  };
}
