import { useFlowStore } from "@movici-flow-common/stores/flow";
import { SimulationMode } from "@movici-flow-common/types";
import type { Scenario, ScenarioDataset, ShortDataset } from "@movici-flow-common/types";
import { computed, ref, watch, type Ref } from "vue";

export function useScenario(params?: { datasets?: Ref<(ScenarioDataset | ShortDataset)[]> }) {
  const datasets = params?.datasets;

  const store = useFlowStore();
  const scenario = ref<Scenario | null>(null);

  watch(
    () => store.scenario,
    async () => {
      if (!store.scenario) return;
      const result = (await store.backend?.scenario.get(store.scenario.uuid)) ?? null;
      scenario.value = result;
      if (datasets) {
        datasets.value = result?.datasets ?? [];
      }
    },
    { immediate: true }
  );
  const timelineInfo = computed(() =>
    scenario.value?.simulation_info.mode === SimulationMode.TIME_ORIENTED
      ? scenario.value.simulation_info
      : null
  );
  return {
    scenario,
    timelineInfo,
  };
}
