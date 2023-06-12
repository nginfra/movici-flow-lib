import { useSummaryStore } from "@movici-flow-common/stores/summary";
import type { ComposableVisualizerInfo } from "@movici-flow-common/visualizers/VisualizerInfo";
import { validateForContentErrors } from "@movici-flow-common/visualizers/viewHelpers";
import isError from "lodash/isError";
import { ref, watch, type Ref } from "vue";

export function useMapVis(visualizers?: Ref<ComposableVisualizerInfo[]>) {
  const { getSummary } = useSummaryStore();
  visualizers ??= ref([]) as Ref<ComposableVisualizerInfo[]>;
  const visualizersWithSummary = ref([]) as Ref<ComposableVisualizerInfo[]>;
  watch(visualizers, async (infos) => {
    const allVisualizers = await Promise.all(
      infos.map(async (info) => {
        info.summary = info.datasetUUID
          ? await getSummary({
              datasetUUID: info.datasetUUID,
              scenarioUUID: info.scenarioUUID,
            })
          : null;
        return info;
      })
    );

    visualizersWithSummary.value = allVisualizers.map((info) => {
      info.unsetError("content");
      try {
        validateForContentErrors(info, info.summary);
      } catch (e) {
        info.setError("content", isError(e) ? e.message : String(e));
      }
      return info;
    });
  });
  return {
    visualizers,
    visualizersWithSummary,
  };
}
