import type { ControllerProps } from "@deck.gl/core";
import { usePopupStore } from "@movici-flow-lib/stores/popup";
import type { Layer } from "@deck.gl/core";
import { ref, type Ref } from "vue";

/* eslint-disable-next-line @typescript-eslint/no-empty-object-type */
export function useDeckGL<D extends {} = {}>() {
  const popup = usePopupStore();
  popup.reset();

  return {
    basemap: ref("mapbox://styles/mapbox/light-v10"),
    controller: ref<Partial<ControllerProps>>(),
    layers: ref([]) as Ref<Layer<D>[]>,
    popup,
  };
}
