import { SummaryNotFound } from "@movici-flow-lib/errors";
import type { DatasetSummary, UUID } from "@movici-flow-lib/types";
import { defineStore } from "pinia";
import { watch } from "vue";
import { useFlowStore } from "./flow";

interface ScenarioDatasetUUID {
  scenarioUUID?: UUID | null;
  datasetUUID: UUID;
}

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
  async function downloadSummary(params: ScenarioDatasetUUID): Promise<DatasetSummary | null> {
    const { datasetUUID, scenarioUUID } = params;

    if (scenarioUUID) {
      return (await flowStore.backend?.summary.getScenario(scenarioUUID, datasetUUID)) ?? null;
    } else {
      return (await flowStore.backend?.summary.getDataset(datasetUUID)) ?? null;
    }
  }

  /** Get a summary if it's already downloaded. Useful for testing
   */
  function getCachedSummary(params: {
    datasetUUID: UUID;
    scenarioUUID?: UUID | null;
  }): DatasetSummary | null {
    return summaries.get(prepareParams(params));
  }

  function hasSummary(params: ScenarioDatasetUUID) {
    return !!getCachedSummary(params);
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
    hasSummary,
    clearSummaries,
  };
});

class HashMap<K, V> {
  private store: Record<string, V>;
  private hash: (k: K) => string;
  constructor(hash: (k: K) => string) {
    this.store = {};
    this.hash = hash;
  }

  get(key: K): V | null {
    return this.store[this.hash(key)] ?? null;
  }
  set(key: K, val: V) {
    this.store[this.hash(key)] = val;
  }
  delete(key: K) {
    delete this.store[this.hash(key)];
  }
  clear() {
    this.store = {};
  }
}
/** A wrapper around a HashMap to hold Promises along with a
 * callback. When a registered promise gets resolved, its callback
 * if the store was not cleared in the mean time.
 *
 * This class is meant to last for mulitple clear operations. After
 * it has been cleared, it can accept new Promises. Any Promise that
 * gets resolved after it has been cleared (goverened by the ``cancelCylce``
 * attribute) will not be processed, while new Promises will be.
 * */
class PromiseStore<K, V> {
  private cancelCycle: number;
  private promises: HashMap<K, Promise<V | null>>;
  constructor(hash: (k: K) => string) {
    this.promises = new HashMap(hash);
    this.cancelCycle = 0;
  }
  get(key: K) {
    return this.promises.get(key);
  }
  add(key: K, promise: Promise<V>, onSuccess: (v: V) => void) {
    const currentCycle = this.cancelCycle;
    this.promises.set(
      key,
      promise
        .then((result) => {
          if (this.cancelCycle <= currentCycle) {
            onSuccess(result);
          }
          return result;
        })
        .finally(() => {
          this.promises.delete(key);
        }),
    );
  }
  clear(): void {
    this.cancelCycle++;
    this.promises.clear();
  }
}
