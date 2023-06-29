import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { useSummaryStore } from "@movici-flow-lib/stores/summary";
import type { DatasetSummary, ShortScenario } from "@movici-flow-lib/types";
import { createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { markRaw } from "vue";
import { useFakeBackend } from "../backend";

describe("useSummaryStore", () => {
  let store: ReturnType<typeof useSummaryStore>;
  let flowStore: ReturnType<typeof useFlowStore>;
  const backend = useFakeBackend();
  beforeEach(() => {
    const pinia = createPinia();
    flowStore = useFlowStore(pinia);
    flowStore.backend = markRaw(backend);
    vi.resetAllMocks();

    store = useSummaryStore(pinia);
  });

  it("retrieves a dataset summary", async () => {
    const sentinel = Symbol("sentinel");
    backend.summary.getDataset.mockResolvedValue(sentinel);
    const result = await store.getSummary({ datasetUUID: "some-uuid" });
    expect(backend.summary.getDataset).toHaveBeenCalledWith("some-uuid");
    expect(result).toBe(sentinel);
  });

  it("only calls backend once for a summary", async () => {
    backend.summary.getDataset.mockResolvedValue({});

    await Promise.all([
      store.getSummary({ datasetUUID: "some-uuid" }),
      store.getSummary({ datasetUUID: "some-uuid" }),
    ]);
    expect(backend.summary.getDataset).toHaveBeenCalledOnce();
  });

  it("returns summary when called multiple times", async () => {
    const sentinel = Symbol("sentinel");

    backend.summary.getDataset.mockResolvedValue(sentinel);

    const result = await Promise.all([
      store.getSummary({ datasetUUID: "some-uuid" }),
      store.getSummary({ datasetUUID: "some-uuid" }),
    ]);
    expect(result).toStrictEqual([sentinel, sentinel]);
  });

  it("stores a dataset summary", async () => {
    const sentinel = Symbol("sentinel");
    backend.summary.getDataset.mockResolvedValue(sentinel);
    await store.getSummary({ datasetUUID: "some-uuid" });
    expect(store.summaries.get({ datasetUUID: "some-uuid" })).toBe(sentinel);
  });

  it("retrieves a scenario summary when explicitely given", async () => {
    const sentinel = Symbol("sentinel");
    backend.summary.getScenario.mockResolvedValue(sentinel);

    const result = await store.getSummary({
      datasetUUID: "some-uuid",
      scenarioUUID: "some-scenario",
    });
    expect(backend.summary.getScenario).toHaveBeenCalledWith("some-scenario", "some-uuid");
    expect(result).toBe(sentinel);
  });

  it("retrieves a scenario summary when there is an active scenario", async () => {
    const sentinel = Symbol("sentinel");
    flowStore.scenario = { uuid: "some-scenario" } as ShortScenario;
    backend.summary.getScenario.mockResolvedValue(sentinel);
    const result = await store.getSummary({
      datasetUUID: "some-uuid",
    });
    expect(backend.summary.getScenario).toHaveBeenCalledWith("some-scenario", "some-uuid");
    expect(result).toBe(sentinel);
  });

  it("stores a scenario summary", async () => {
    const sentinel = Symbol("sentinel");
    backend.summary.getScenario.mockResolvedValue(sentinel);
    await store.getSummary({ datasetUUID: "some-uuid", scenarioUUID: "some-scenario" });
    expect(store.summaries.get({ scenarioUUID: "some-scenario", datasetUUID: "some-uuid" })).toBe(
      sentinel
    );
  });

  it("retrieves a dataset summary from cache", () => {
    const sentinel = { count: 1 };
    store.summaries.set({ datasetUUID: "some-uuid" }, sentinel as DatasetSummary);
    expect(store.getCachedSummary({ datasetUUID: "some-uuid" })).toStrictEqual(sentinel);
  });

  it("retrieves a scenario summary from cache when explicitely given", () => {
    const sentinel = { count: 1 };
    store.summaries.set(
      { scenarioUUID: "some-scenario", datasetUUID: "some-uuid" },
      sentinel as DatasetSummary
    );

    expect(
      store.getCachedSummary({ datasetUUID: "some-uuid", scenarioUUID: "some-scenario" })
    ).toStrictEqual(sentinel);
  });
  it("retrieves a scenario summary from cache with an active scenario", () => {
    const sentinel = { count: 1 };
    flowStore.scenario = { uuid: "some-scenario" } as ShortScenario;
    store.summaries.set(
      { scenarioUUID: "some-scenario", datasetUUID: "some-uuid" },
      sentinel as DatasetSummary
    );
    expect(store.getCachedSummary({ datasetUUID: "some-uuid" })).toStrictEqual(sentinel);
  });
});
