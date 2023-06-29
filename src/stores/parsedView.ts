import { useMoviciSettings } from "@movici-flow-lib/baseComposables/useMoviciSettings";
import type { ViewState } from "@movici-flow-lib/types";
import type {
  ChartVisualizerInfo,
  ComposableVisualizerInfo,
} from "@movici-flow-lib/visualizers/VisualizerInfo";
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";

export const useParsedViewStore = defineStore("parsed-view", () => {
  const defaultViewState = () => useMoviciSettings().settings.defaultViewState;
  const visualizerInfos = ref([]) as Ref<ComposableVisualizerInfo[]>;
  const chartInfos: Ref<ChartVisualizerInfo[]> = ref([]);
  const timestamp = ref(0);
  const viewState = ref<ViewState>(defaultViewState());
  const initialViewState = ref<ViewState>(defaultViewState());

  function reset() {
    visualizerInfos.value = [];
    chartInfos.value = [];
    timestamp.value = 0;
    viewState.value = defaultViewState();
    initialViewState.value = defaultViewState();
  }
  return {
    visualizerInfos,
    chartInfos,
    timestamp,
    viewState,
    initialViewState,
    reset,
  };
});
