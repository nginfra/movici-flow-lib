import type { ControllerProps } from "@deck.gl/core";
import type { BoundingBox } from "@movici-flow-lib/crs";
import { usePopupStore } from "@movici-flow-lib/stores/popup";
import type { Layer } from "@deck.gl/core";
import { ref, type Ref } from "vue";

/* eslint-disable-next-line @typescript-eslint/no-empty-object-type */
export function useDeckGL<D extends {} = {}>() {
  const popup = usePopupStore();
  popup.reset();

  return {
    deck: ref<{ zoomToBBox(bbox: BoundingBox, ratio?: number): void } | null>(null),
    basemap: ref("mapbox://styles/mapbox/light-v10"),
    controller: ref<ControllerProps>(),
    layers: ref([]) as Ref<Layer<D>[]>,
    popup,
  };
}
