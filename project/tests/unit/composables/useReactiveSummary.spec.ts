import { useReactiveSummary } from "@movici-flow-lib/composables/useReactiveSummary";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import type {
  DatasetSummary,
  EntityGroupSummary,
  AttributeSummary,
  ShortDataset,
} from "@movici-flow-lib/types";
import { createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFakeBackend } from "../backend";
import { nextTick } from "vue";

describe("useReactiveSummary", () => {
  let flowStore: ReturnType<typeof useFlowStore>;
  const backend = useFakeBackend();
  const datasetSummary: Partial<DatasetSummary> = {
    entity_groups: [
      {
        name: "some_entities",
        properties: [{ name: "attr" }] as AttributeSummary[],
      },
    ] as EntityGroupSummary[],
  };
  beforeEach(() => {
    const pinia = createPinia();
    flowStore = useFlowStore(pinia);
    flowStore.backend = backend;
    vi.resetAllMocks();
    backend.summary.getDataset.mockResolvedValue(datasetSummary);
  });
  it("can set current dataset by uuid", async () => {
    const { datasets, currentDatasetUUID, currentDataset } = useReactiveSummary();
    datasets.value = [
      { name: "dataset-a", uuid: "some-uuid" },
      { name: "dataset-b", uuid: "also-uuid" },
    ] as ShortDataset[];
    currentDatasetUUID.value = "some-uuid";
    await nextTick();
    expect(currentDataset.value?.name).toStrictEqual("dataset-a");
  });
  it("can set current dataset by name", () => {
    const { datasets, currentDatasetName, currentDataset } = useReactiveSummary();
    datasets.value = [
      { name: "dataset-a", uuid: "some-uuid" },
      { name: "dataset-b", uuid: "also-uuid" },
    ] as ShortDataset[];
    currentDatasetName.value = "dataset-b";
    expect(currentDataset.value?.uuid).toStrictEqual("also-uuid");
  });
  it("lists datasets by name", () => {
    const { datasets, datasetsByName } = useReactiveSummary();
    datasets.value = [
      { name: "dataset-a", uuid: "some-uuid" },
      { name: "dataset-b", uuid: "also-uuid" },
    ] as ShortDataset[];
    expect(datasetsByName.value).toStrictEqual({
      "dataset-a": { name: "dataset-a", uuid: "some-uuid" },
      "dataset-b": { name: "dataset-b", uuid: "also-uuid" },
    });
  });

  it("accepts currentDatasetUUID even if no datasets are available", () => {
    const { currentDatasetUUID } = useReactiveSummary();
    currentDatasetUUID.value = "some-uuid";
    expect(currentDatasetUUID.value).toStrictEqual("some-uuid");
  });

  it("shows entity groups", () => {
    const { currentDataset, entityGroups, summary } = useReactiveSummary();
    currentDataset.value = { name: "dataset-a", uuid: "some-uuid" } as ShortDataset;
    summary.value = datasetSummary as DatasetSummary;
    expect(entityGroups.value).toStrictEqual([
      {
        name: "some_entities",
        properties: [{ name: "attr" }],
      },
    ]);
  });
  it("shows entity summary when entity group set", () => {
    const { currentDataset, entitySummary, summary, currentEntityName } = useReactiveSummary();
    summary.value = datasetSummary as DatasetSummary;
    currentDataset.value = { name: "dataset-a", uuid: "some-uuid" } as ShortDataset;
    currentEntityName.value = "some_entities";
    expect(entitySummary.value).toStrictEqual({
      name: "some_entities",
      properties: [{ name: "attr" }],
    });
  });
  it("shows attributes when entity group is set", () => {
    const { currentDataset, attributes, summary, currentEntityName } = useReactiveSummary();
    summary.value = datasetSummary as DatasetSummary;
    currentDataset.value = { name: "dataset-a", uuid: "some-uuid" } as ShortDataset;
    currentEntityName.value = "some_entities";
    expect(attributes.value).toStrictEqual([{ name: "attr" }]);
  });

  // Somehow, the 'getSummaryByUUID', watcher callback is not properly and timely executed during
  // tests, not even when using `await nextTick()` making the following tests impossible to
  // execute in a meaningful way. Perhaps we can fix this at a later stage
  it("requests summary for current dataset");
  it("doesn't request summary when no current dataset");
  it("resets current entity group");
  it("keeps current entity group when available");
});
