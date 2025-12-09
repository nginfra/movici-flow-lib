import { useMoviciSettings } from "@movici-flow-lib/baseComposables/useMoviciSettings";
import type { DeckCamera } from "@movici-flow-lib/types";
import type {
  ChartVisualizerInfo,
  ComposableVisualizerInfo,
} from "@movici-flow-lib/visualizers/VisualizerInfo";
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";

export const useParsedViewStore = defineStore("parsed-view", () => {
  const defaultCamera = () => ({ viewState: useMoviciSettings().settings.defaultViewState });
  const visualizerInfos = ref([]) as Ref<ComposableVisualizerInfo[]>;
  const chartInfos: Ref<ChartVisualizerInfo[]> = ref([]);
  const timestamp = ref(0);
  const camera = ref<DeckCamera>(defaultCamera());
  const initialCamera = ref<DeckCamera>(defaultCamera());

  function reset(toCamera?: DeckCamera) {
    toCamera ??= defaultCamera();
    visualizerInfos.value = [];
    chartInfos.value = [];
    timestamp.value = 0;
    camera.value = toCamera;
    initialCamera.value = toCamera;
  }
  return {
    visualizerInfos,
    chartInfos,
    timestamp,
    camera,
    initialCamera,
    reset,
  };
});
