import { SummaryNotFound } from "@movici-flow-lib/errors";
import type { DatasetSummary, UUID } from "@movici-flow-lib/types";
import { defineStore } from "pinia";
import { watch } from "vue";
import { useFlowStore } from "./flow";
import HashMap from "@movici-flow-lib/utils/HashMap";
import PromiseStore from "@movici-flow-lib/utils/PromiseStore";

type ScenarioDatasetUUID = {
  scenarioUUID?: UUID | null;
  datasetUUID: UUID;
};

function hash(params: ScenarioDatasetUUID) {
  return params.scenarioUUID ? `${params.scenarioUUID}:${params.datasetUUID}` : params.datasetUUID;
}
export const useSummaryStore = defineStore("summary", () => {
  const flowStore = useFlowStore();

  const summaries = new HashMap<ScenarioDatasetUUID, DatasetSummary>(hash);
  const promises = new PromiseStore<ScenarioDatasetUUID, DatasetSummary | null>(hash);

  function prepareParams(params: ScenarioDatasetUUID): ScenarioDatasetUUID {
    return {
      datasetUUID: params.datasetUUID,
      scenarioUUID:
        params.scenarioUUID === undefined ? flowStore.scenario?.uuid : params.scenarioUUID,
    };
  }
  async function getSummary(params: ScenarioDatasetUUID): Promise<DatasetSummary> {
    const result = await getSummaryOrNull(prepareParams(params));
    if (!result) throw new SummaryNotFound();
    return result;
  }
  async function getSummaryOrNull(params: ScenarioDatasetUUID): Promise<DatasetSummary | null> {
    const summary = summaries.get(params);
    if (summary) return summary;

    let promise = promises.get(params);
    if (!promise) {
      promise = downloadSummary(params);
      promises.add(params, promise, (result) => {
        result && summaries.set(params, result);
      });
    }
    return await promise;
  }
  async function downloadSummary(params: {
    datasetUUID: UUID;
    scenarioUUID?: UUID | null;
  }): Promise<DatasetSummary | null> {
    const { datasetUUID, scenarioUUID } = params;

    if (scenarioUUID) {
      return (await flowStore.backend?.summary.getScenario(scenarioUUID, datasetUUID)) ?? null;
    } else {
      return (await flowStore.backend?.summary.getDataset(datasetUUID)) ?? null;
    }
  }

  function getCachedSummary(params: {
    datasetUUID: UUID;
    scenarioUUID?: UUID | null;
  }): DatasetSummary {
    const { datasetUUID, scenarioUUID } = prepareParams(params);

    const summary = summaries.get({ datasetUUID, scenarioUUID });
    if (!summary) throw new SummaryNotFound();
    return summary;
  }
  function clearSummaries() {
    promises.clear();
    summaries.clear();
  }

  watch(() => flowStore.scenario, clearSummaries);
  return {
    summaries,
    getSummary,
    getCachedSummary,
    clearSummaries,
  };
});
