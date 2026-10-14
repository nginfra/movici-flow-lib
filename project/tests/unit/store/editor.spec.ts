import { useEditorStore } from "@movici-flow-lib/stores/editor";
import { useEditorHistoryStore } from "@movici-flow-lib/stores/editorHistory";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { useMoviciSettings } from "@movici-flow-lib/baseComposables/useMoviciSettings";
import { createPinia, type Pinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, type Mock } from "vitest";
import { markRaw } from "vue";
import { useFakeBackend } from "../backend";

const GROUP = "point_entities";

// EPSG:28992 is registered statically in src/crs.ts
function makeFixture() {
  return {
    uuid: "d1",
    name: "some_dataset",
    type: "point_set",
    epsg_code: 28992,
    data: {
      [GROUP]: {
        id: [1, 2, 3],
        "geometry.x": [0, 10, 20],
        "geometry.y": [0, 10, 20],
        "grid.load": [1, 2, 3],
        label: ["a", "b", "c"],
      },
    },
  };
}

describe("useEditorStore", () => {
  let pinia: Pinia;
  let store: ReturnType<typeof useEditorStore>;
  let history: ReturnType<typeof useEditorHistoryStore>;

  function groupData() {
    return store.dataset!.data![GROUP] as unknown as Record<string, unknown[]>;
  }

  function pending(id: number, prop: string) {
    return store.changes.get(GROUP)?.get(id)?.[prop];
  }

  beforeEach(async () => {
    pinia = createPinia();
    const flowStore = useFlowStore(pinia);
    const backend = useFakeBackend(["patchDatasets"]);
    flowStore.backend = markRaw(backend);
    // loadDataset mutates the object it is handed
    (backend.dataset.getData as Mock).mockImplementation(async () => makeFixture());
    store = useEditorStore(pinia);
    history = useEditorHistoryStore(pinia);
    await store.loadDataset("d1");
  });

  afterEach(() => {
    useMoviciSettings().updateSettings({ restrictedAttributes: [] });
  });

  describe("updatePropertyForIds", () => {
    it("writes the value for every id in a single command", () => {
      store.updatePropertyForIds(GROUP, [1, 2, 3], "grid.load", 42);

      expect(pending(1, "grid.load")).toBe(42);
      expect(pending(2, "grid.load")).toBe(42);
      expect(pending(3, "grid.load")).toBe(42);
      expect(history.undoStack).toHaveLength(1);
      expect(history.undoStack[0]!.kind).toBe("batch-property");
    });

    it("is undone by a single undo", () => {
      store.updatePropertyForIds(GROUP, [1, 2, 3], "grid.load", 42);
      store.undo();

      expect(store.changes.get(GROUP)?.size ?? 0).toBe(0);
      expect(store.isDirty).toBe(false);
      expect(history.undoStack).toHaveLength(0);
    });

    it("is re-applied by redo", () => {
      store.updatePropertyForIds(GROUP, [1, 2, 3], "grid.load", 42);
      store.undo();
      store.redo();

      expect(pending(1, "grid.load")).toBe(42);
      expect(pending(2, "grid.load")).toBe(42);
      expect(pending(3, "grid.load")).toBe(42);
    });

    it("records the pending value as oldValue, not the on-disk one", () => {
      store.updateProperty(GROUP, 2, "grid.load", 99);
      store.updatePropertyForIds(GROUP, [1, 2, 3], "grid.load", 42);
      store.undo();

      expect(pending(2, "grid.load")).toBe(99);
      expect(pending(1, "grid.load")).toBeUndefined();
      expect(pending(3, "grid.load")).toBeUndefined();
    });

    it("is a no-op for restricted attributes", () => {
      useMoviciSettings().updateSettings({ restrictedAttributes: ["label"] });

      store.updatePropertyForIds(GROUP, [1, 2, 3], "id", 42);
      store.updatePropertyForIds(GROUP, [1, 2, 3], "geometry.x", 42);
      store.updatePropertyForIds(GROUP, [1, 2, 3], "label", "z");

      expect(store.changes.get(GROUP)?.size ?? 0).toBe(0);
      expect(history.undoStack).toHaveLength(0);
    });
  });

  describe("deleteAttribute", () => {
    it("marks an existing attribute deleted without dropping the column", () => {
      expect(store.deleteAttribute(GROUP, "label")).toBe(true);

      expect(store.isAttributeDeleted(GROUP, "label")).toBe(true);
      expect("label" in groupData()).toBe(true);
      expect(store.dirtyCount).toBe(1);
      expect(store.isDirty).toBe(true);
    });

    it("discards pending changes for that attribute only", () => {
      store.updateProperty(GROUP, 1, "label", "x");
      store.updateProperty(GROUP, 3, "label", "y");
      store.updateProperty(GROUP, 2, "grid.load", 42);
      expect(store.dirtyCount).toBe(3);

      store.deleteAttribute(GROUP, "label");

      expect(store.changes.get(GROUP)?.has(1)).toBe(false);
      expect(store.changes.get(GROUP)?.has(3)).toBe(false);
      expect(pending(2, "grid.load")).toBe(42);
      expect(store.dirtyCount).toBe(2);
    });

    it("removes an attribute added in this session outright", () => {
      expect(store.addAttribute(GROUP, "new.attr", "integer")).toBe(true);
      expect(store.deleteAttribute(GROUP, "new.attr")).toBe(true);

      expect("new.attr" in groupData()).toBe(false);
      expect(store.newAttributeTypes.get(GROUP)?.has("new.attr")).toBe(false);
      expect(store.isAttributeDeleted(GROUP, "new.attr")).toBe(false);
      expect(store.dirtyCount).toBe(0);
    });

    it("undoes and redoes the deletion of an existing attribute", () => {
      store.deleteAttribute(GROUP, "label");

      store.undo();
      expect(store.isAttributeDeleted(GROUP, "label")).toBe(false);
      expect(store.dirtyCount).toBe(0);

      store.redo();
      expect(store.isAttributeDeleted(GROUP, "label")).toBe(true);
    });

    it("undoes and redoes the deletion of a new attribute, declared type included", () => {
      store.addAttribute(GROUP, "new.attr", "integer");
      store.deleteAttribute(GROUP, "new.attr");

      store.undo();
      expect(groupData()["new.attr"]).toEqual([null, null, null]);
      expect(store.newAttributeTypes.get(GROUP)?.get("new.attr")).toBe("integer");

      store.redo();
      expect("new.attr" in groupData()).toBe(false);
      expect(store.newAttributeTypes.get(GROUP)?.has("new.attr")).toBe(false);
    });

    it("refuses restricted and unknown attributes", () => {
      useMoviciSettings().updateSettings({ restrictedAttributes: ["label"] });

      expect(store.deleteAttribute(GROUP, "id")).toBe(false);
      expect(store.deleteAttribute(GROUP, "geometry.x")).toBe(false);
      expect(store.deleteAttribute(GROUP, "label")).toBe(false);
      expect(store.deleteAttribute(GROUP, "does.not.exist")).toBe(false);
      expect(store.dirtyCount).toBe(0);
    });

    it("is cleared by discardChanges", async () => {
      store.deleteAttribute(GROUP, "label");

      await store.discardChanges();

      expect(store.isAttributeDeleted(GROUP, "label")).toBe(false);
      expect(store.deletedAttributes.size).toBe(0);
      expect(store.isDirty).toBe(false);
    });
  });

  describe("selection", () => {
    it("narrows a multi-selection back to one entity", () => {
      store.setMultiSelection([1, 2, 3]);
      expect(store.selectedIds).toHaveLength(3);
      expect(store.selectedId).toBeNull();

      store.selectEntity(2);
      expect(store.selectedIds).toEqual([2]);
    });
  });

  describe("edit modes", () => {
    it("stay in delete mode after deleting and entity", () => {
      store.setEditMode("delete");
      store.deleteEntity(GROUP, 2);

      expect(store.editModeKey).toBe("delete");
      expect(store.dirtyCount).toBe(1);
    });

    it("stays in delete mode when the deletion is undone", () => {
      store.setEditMode("delete");
      store.deleteEntity(GROUP, 2);
      store.undo();

      expect(store.editModeKey).toBe("delete");
      expect(store.dirtyCount).toBe(0);
    });

    it("drops a draw mode when the entity group is re-selected", () => {
      store.setEditMode("draw-point");
      store.selectEntityGroup(GROUP);

      expect(store.editModeKey).toBe("view");
    });

    it("stays in measure mode when the entity group is re-selected", () => {
      store.setEditMode("measure");
      store.selectEntityGroup(GROUP);

      expect(store.editModeKey).toBe("measure");
    });
  });

  describe("snapping", () => {
    function snapTargetIds() {
      return store.snapTargets.map((f) => f.properties?.__id);
    }

    beforeEach(() => {
      store.setSnappingEnabled(true);
      store.setEditMode("draw-point");
    });

    it("has no snap targets while snapping is off", () => {
      store.setSnappingEnabled(false);
      expect(store.snapTargets).toEqual([]);
    });

    it("has no snap targets outside the snapping modes", () => {
      store.setEditMode("view");
      expect(store.snapTargets).toEqual([]);
    });

    it("snaps to every entity of a group in a draw mode", () => {
      expect(snapTargetIds()).toEqual([1, 2, 3]);
    });

    it("excludes a group that is not snappable", () => {
      store.setGroupSnappable(GROUP, false);

      expect(store.isGroupSnappable(GROUP)).toBe(false);
      expect(store.snapTargets).toEqual([]);
    });

    it("excludes hidden groups", () => {
      store.setGroupVisible(GROUP, false);
      expect(store.snapTargets).toEqual([]);
    });

    it("has no snap targets when all snap types are off", () => {
      store.toggleSnapType("vertex");
      store.toggleSnapType("segment");

      expect(store.snapTypes).toEqual([]);
      expect(store.snapTargets).toEqual([]);
    });

    it("excludes the edited entity in modify mode", () => {
      store.setEditMode("modify");
      store.selectEntity(2);

      expect(snapTargetIds()).toEqual([1, 3]);
    });

    it("keeps the selected entity snappable in a draw mode", () => {
      store.selectEntity(2);
      expect(snapTargetIds()).toEqual([1, 2, 3]);
    });

    it("keeps group exclusions when the same dataset is reloaded", async () => {
      store.setGroupSnappable(GROUP, false);
      await store.loadDataset("d1");

      expect(store.isGroupSnappable(GROUP)).toBe(false);
    });

    it("resets group exclusions when another dataset is loaded", async () => {
      store.setGroupSnappable(GROUP, false);
      await store.loadDataset("d2");

      expect(store.isGroupSnappable(GROUP)).toBe(true);
      expect(store.snappingEnabled).toBe(true);
    });

    it("tracks projection readiness while loading", async () => {
      const getData = useFlowStore(pinia).backend!.dataset.getData as Mock;
      let resolveData!: (data: ReturnType<typeof makeFixture>) => void;
      getData.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveData = resolve;
          }),
      );

      const load = store.loadDataset("pending");
      expect(store.projectionReady).toBe(false);

      resolveData(makeFixture());
      await load;
      expect(store.projectionReady).toBe(true);
    });

    it("keeps projection readiness false when projection setup fails", async () => {
      const getData = useFlowStore(pinia).backend!.dataset.getData as Mock;
      const fixture = makeFixture();
      fixture.epsg_code = 999999;
      getData.mockImplementationOnce(async () => fixture);

      await store.loadDataset("unsupported-crs");

      expect(store.projectionReady).toBe(false);
      expect(store.error).toContain("Could not determine projection");
    });

    it("marks projection ready after a successful dataset load", () => {
      expect(store.projectionReady).toBe(true);
    });
  });

  it.todo(
    "generatePatch emits pending attribute deletions once DatasetPatch supports attribute drops",
  );
});
