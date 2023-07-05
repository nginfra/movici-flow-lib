import type { ControllerOptions } from "@deck.gl/core/controllers/controller";
import { usePopupStore } from "@movici-flow-lib/stores/popup";
import type { Layer } from "deck.gl";
import { ref, type Ref } from "vue";

export function useDeckGL<D = unknown>() {
  const popup = usePopupStore();
  popup.reset();

  return {
    basemap: ref("mapbox://styles/mapbox/light-v10"),
    controller: ref<ControllerOptions>(),
    layers: ref([]) as Ref<Layer<D>[]>,
    popup,
  };
}
