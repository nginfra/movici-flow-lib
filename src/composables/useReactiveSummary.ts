import { useSummaryStore } from "@movici-flow-lib/stores/summary";
import type {
  DatasetSummary,
  Dataset,
  ScenarioDataset,
  UUID,
  ShortDataset,
} from "@movici-flow-lib/types";
import { computed, ref, watch, type Ref } from "vue";

export function useReactiveSummary() {
  const store = useSummaryStore();
  const summary = ref<DatasetSummary>();
  const currentDataset = ref<ShortDataset | ScenarioDataset>();
  const currentDatasetName = computed({
    get: () => currentDataset.value?.name,
    set: (name?: string) => {
      currentDataset.value = datasets.value.find((d) => d.name === name);
    },
  });
  const currentDatasetUUID = ref<string>();
  const currentEntityName = ref<string>();
  const datasets = ref([]) as Ref<(Dataset | ScenarioDataset)[]>;

  watch(currentDatasetUUID, (uuid) => {
    currentDataset.value = datasets.value.find((d) => d.uuid === uuid);
  });

  watch(currentDataset, (ds) => {
    currentDatasetUUID.value = ds?.uuid;
  });

  const datasetsByName = computed(() => {
    return datasets.value.reduce((rv: Record<string, Dataset | ScenarioDataset>, d) => {
      rv[d.name] = d;
      return rv;
    }, {});
  });

  const entitySummary = computed(
    () => summary.value?.entity_groups.find((e) => e.name === currentEntityName.value) ?? null
  );
  const entityGroups = computed(() => summary.value?.entity_groups);
  const attributes = computed(() => entitySummary.value?.properties);

  async function getSummaryByUUID(uuid?: UUID) {
    if (uuid) {
      summary.value = await store.getSummary({ datasetUUID: uuid });
    } else {
      summary.value = undefined;
    }

    if (summary.value?.entity_groups.find((e) => e.name === currentEntityName.value) == undefined) {
      // reset the current entitygroup only if it doesn't exist on the current dataset.
      // if dataset summary changes, the entity summary will still be updated
      currentEntityName.value = undefined;
    }
  }
  watch(currentDatasetUUID, getSummaryByUUID);

  return {
    summary,
    currentDataset,
    currentDatasetName,
    currentDatasetUUID,
    datasets,
    currentEntityName,
    datasetsByName,
    entityGroups,
    attributes,
    entitySummary,
  };
}
