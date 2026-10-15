import type { PickingInfo } from "@deck.gl/core";
import { useMeasureTool } from "@movici-flow-lib/composables/useMeasureTool";
import { useEditorStore } from "@movici-flow-lib/stores/editor";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { createPinia, setActivePinia, type Pinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, type Mock } from "vitest";
import { effectScope, markRaw, nextTick, type EffectScope } from "vue";
import { useFakeBackend } from "../backend";

// EPSG:28992 is registered in src/crs.ts
function makeFixture() {
  return {
    uuid: "d1",
    name: "some_dataset",
    type: "mixed",
    epsg_code: 28992,
    data: {
      lines: {
        id: [1],
        // 250 m, RD coordinates
        "geometry.linestring_2d": [
          [
            [155000, 463000],
            [155250, 463000],
          ],
        ],
      },
      points: { id: [1], "geometry.x": [155000], "geometry.y": [463000] },
    },
  };
}

describe("useMeasureTool", () => {
  let pinia: Pinia;
  let store: ReturnType<typeof useEditorStore>;
  let scope: EffectScope;
  let tool: ReturnType<typeof useMeasureTool>;

  function pickOf(groupName: string) {
    return {
      object: store.wgs84Features[groupName]![0],
      layer: { id: `editable-${groupName}` },
      coordinate: [5, 52],
    } as unknown as PickingInfo;
  }

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);
    const flowStore = useFlowStore(pinia);
    const backend = useFakeBackend([]);
    flowStore.backend = markRaw(backend);
    (backend.dataset.getData as Mock).mockImplementation(async () => makeFixture());
    store = useEditorStore(pinia);
    await store.loadDataset("d1");
    store.setEditMode("measure");

    scope = effectScope();
    tool = scope.run(() => useMeasureTool())!;
  });

  afterEach(() => scope.stop());

  it("measures a clicked line", () => {
    tool.onClick(pickOf("lines"));

    expect(tool.measurement.value?.kind).toBe("line");
    if (tool.measurement.value?.kind !== "line") return;
    expect(tool.measurement.value.length).toBeCloseTo(250, 3);
  });

  it("ignores points", () => {
    tool.onClick(pickOf("points"));

    expect(tool.target.value).toBeNull();
    expect(tool.measurement.value).toBeNull();
  });

  it("clears on a click on empty map", () => {
    tool.onClick(pickOf("lines"));
    tool.onClick(undefined);

    expect(tool.target.value).toBeNull();
  });

  it("clears when leaving measure mode", async () => {
    tool.onClick(pickOf("lines"));
    store.setEditMode("view");
    await nextTick();

    expect(tool.target.value).toBeNull();
  });

  it("clears when the measured group is hidden and stays cleared when shown again", async () => {
    tool.onClick(pickOf("lines"));
    store.setGroupVisible("lines", false);

    expect(tool.measurement.value).toBeNull();
    await nextTick();
    expect(tool.target.value).toBeNull();

    store.setGroupVisible("lines", true);
    expect(tool.measurement.value).toBeNull();
  });
});
