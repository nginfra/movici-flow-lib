import { defineStore } from "pinia";
import { computed, ref, shallowRef, triggerRef } from "vue";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { CAPABILITIES } from "@movici-flow-lib/api";
import { ensureProjection } from "@movici-flow-lib/crs";
import type {
  DatasetWithData,
  DatasetPatch,
  PatchData,
  PatchValue,
  PatchEntityGroupData,
  EntityGroupData,
} from "@movici-flow-lib/types";
import {
  createGeometryBridge,
  DEFAULT_GEOMETRY_COLUMNS,
} from "@movici-flow-lib/utils/geoJsonBridge";
import type {
  GeometryBridge,
  GeometryData,
  GeometryType,
} from "@movici-flow-lib/utils/geoJsonBridge";
import {
  ViewMode,
  ModifyMode,
  TranslateMode,
  DrawPointMode,
  DrawLineStringMode,
  DrawPolygonMode,
} from "@deck.gl-community/editable-layers";
import type { Feature } from "geojson";
import {
  useEditorHistoryStore,
  type Command,
  type UpdatePropertyCommand,
  type GeometryCommand,
  type CreateCommand,
} from "@movici-flow-lib/stores/editorHistory";

type Changes = Map<string, Map<number, Record<string, unknown>>>;

export type EditModeKey =
  | "view"
  | "modify"
  | "translate"
  | "draw-point"
  | "draw-line"
  | "draw-polygon"
  | "delete"
  | "select-rectangle";

export const useEditorStore = defineStore("editor", () => {
  const datasetUUID = ref<string | null>(null);
  const dataset = shallowRef<DatasetWithData | null>(null);
  const entityGroup = ref<string | null>(null);
  const selectedId = ref<number | null>(null);
  const changes = ref<Changes>(new Map());
  const geometryChanges = ref<Changes>(new Map());
  const bridges = shallowRef<Record<string, GeometryBridge>>({});
  const idIndex = shallowRef<Record<string, Map<number, number>>>({});
  const nextId = shallowRef<Record<string, number>>({});
  const wgs84Features = shallowRef<Record<string, Feature[]>>({});
  // Ids of entities created in an editing session (new entities)
  const newEntityIds = ref<Map<string, Set<number>>>(new Map());
  // Ids of existing entities deleted in an editing session
  const deletedEntityIds = ref<Map<string, Set<number>>>(new Map());
  // Ids of entities selected via rectangle selection (only for current entity group)
  const multiSelectedIds = ref<number[]>([]);
  const saving = ref(false);
  const error = ref<string | null>(null);

  // Edit mode
  const editModeKey = ref<EditModeKey>("view");
  const modeInstances: Record<EditModeKey, unknown> = {
    view: new ViewMode(),
    modify: new ModifyMode(),
    translate: new TranslateMode(),
    "draw-point": new DrawPointMode(),
    "draw-line": new DrawLineStringMode(),
    "draw-polygon": new DrawPolygonMode(),
    // "delete" reuses ViewMode. Clicking a feature is intercepted by EditorView's click handler
    delete: new ViewMode(),
    // "select-rect" reuses ViewMode. The SelectionLayer handles the rectangle interaction
    "select-rectangle": new ViewMode(),
  };

  const editMode = computed(() => modeInstances[editModeKey.value]);
  const historyStore = useEditorHistoryStore();
  const flowStore = useFlowStore();

  const entityGroupNames = computed<string[]>(() => {
    if (!dataset.value?.data) return [];
    return Object.keys(dataset.value.data);
  });

  const selectedEntity = computed<Record<string, unknown> | null>(() => {
    if (selectedId.value === null || !entityGroup.value) return null;
    const groupData = dataset.value?.data?.[entityGroup.value] as
      | Record<string, unknown[]>
      | undefined;
    if (!groupData) return null;
    const index = rowIndex(entityGroup.value, selectedId.value);
    if (index === -1) return null;
    const row: Record<string, unknown> = {};
    for (const key of Object.keys(groupData)) {
      row[key] = (groupData[key] as unknown[])[index];
    }
    // Apply pending changes on top
    const pending = changes.value.get(entityGroup.value)?.get(selectedId.value);
    if (pending) {
      Object.assign(row, pending);
    }
    return row;
  });

  const selectedIsNew = computed(() => {
    if (!entityGroup.value || selectedId.value === null) return false;
    return newEntityIds.value.get(entityGroup.value)?.has(selectedId.value) ?? false;
  });

  // Bounding box [minX, minY, maxX, maxY] in the dataset CRS from geometry columns.
  // It handles point (geometry.x/y), line (geometry.linestring_2d/3d) and polygon.
  const boundingBox = computed<[number, number, number, number] | null>(() => {
    if (!dataset.value?.data) return null;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    let found = false;

    for (const [groupName, groupData] of Object.entries(dataset.value.data)) {
      const bounds = bridges.value[groupName]?.getBounds(groupData);
      if (!bounds) continue;
      found = true;
      if (bounds[0] < minX) minX = bounds[0];
      if (bounds[1] < minY) minY = bounds[1];
      if (bounds[2] > maxX) maxX = bounds[2];
      if (bounds[3] > maxY) maxY = bounds[3];
    }
    return found ? [minX, minY, maxX, maxY] : null;
  });

  const currentGroupGeometryType = computed(() =>
    entityGroup.value ? (bridges.value[entityGroup.value]?.geometryType ?? null) : null,
  );

  const isDirty = computed(() => {
    for (const groupChanges of changes.value.values()) {
      if (groupChanges.size > 0) return true;
    }
    for (const groupGeomChanges of geometryChanges.value.values()) {
      if (groupGeomChanges.size > 0) return true;
    }
    for (const id of deletedEntityIds.value.values()) {
      if (id.size > 0) return true;
    }
    // A new entity group is deliberately NOT dirty on its own: the backend rejects
    // groups with zero entities. It becomes dirty via geometryChanges as soon as
    // addEntity puts the first entity in it, and generatePatch skips empty groups.
    return false;
  });

  const dirtyCount = computed(() => {
    let count = 0;
    for (const groupChanges of changes.value.values()) {
      count += groupChanges.size;
    }
    for (const groupGeomChanges of geometryChanges.value.values()) {
      count += groupGeomChanges.size;
    }
    for (const ids of deletedEntityIds.value.values()) {
      count += ids.size;
    }
    return count;
  });

  function generatePatch(): DatasetPatch {
    const data: PatchData = {};

    // Collect all entity groups that have changes
    const allGroups = new Set([
      ...changes.value.keys(),
      ...geometryChanges.value.keys(),
      ...deletedEntityIds.value.keys(),
      ...newEntityIds.value.keys(),
    ]);

    let hasClears = false;
    for (const groupChanges of changes.value.values()) {
      for (const entityChanges of groupChanges.values()) {
        if (Object.values(entityChanges).some((v) => v === null)) hasClears = true;
      }
    }

    for (const entityGroup of allGroups) {
      const propChanges =
        changes.value.get(entityGroup) ?? new Map<number, Record<string, unknown>>();
      const geomChanges =
        geometryChanges.value.get(entityGroup) ?? new Map<number, Record<string, unknown>>();
      const deletedIds = deletedEntityIds.value.get(entityGroup) ?? new Set<number>();
      const newIds = newEntityIds.value.get(entityGroup) ?? new Set<number>();
      const editedIds = new Set([...propChanges.keys(), ...geomChanges.keys(), ...newIds]);
      // Collects IDs of edited entities first, then IDs of deleted entities.
      const allIds = [...editedIds, ...deletedIds];
      if (allIds.length === 0) continue;

      const touchedProps = new Set<string>();
      for (const entityChanges of [...propChanges.values(), ...geomChanges.values()]) {
        for (const prop of Object.keys(entityChanges)) touchedProps.add(prop);
      }

      const group: PatchEntityGroupData = { id: allIds.map((id) => (newIds.has(id) ? -1 : id)) };

      for (const prop of touchedProps) {
        group[prop] = allIds.map((id) => {
          if (deletedIds.has(id)) return null;
          const pending = { ...propChanges.get(id), ...geomChanges.get(id) };
          if (prop in pending) return pending[prop] as PatchValue;
          return hasClears ? getCurrentValue(entityGroup, id, prop) : null;
        });
      }

      if (deletedIds.size > 0) {
        group.deleted = allIds.map((id) => deletedIds.has(id));
      }

      data[entityGroup] = group;
    }
    return { nulls_overwrite: hasClears, data };
  }

  // Guards against races when datasets are switched quickly
  let loadToken = 0;

  async function loadDataset(uuid: string) {
    const token = ++loadToken;
    datasetUUID.value = null;
    dataset.value = null;
    entityGroup.value = null;
    selectedId.value = null;
    changes.value = new Map();
    geometryChanges.value = new Map();
    wgs84Features.value = {};
    newEntityIds.value = new Map();
    deletedEntityIds.value = new Map();
    newAttributeTypes.value = new Map();
    newEntityGroups.value = new Set();
    historyStore.clear();
    error.value = null;

    if (!flowStore.backend) {
      error.value = "Backend not initialized";
      return;
    }
    // The editor needs every entity group and attribute, so getData is called
    // without a filter: the backend must return the full
    // dataset
    const result = await flowStore.backend.dataset.getData({ datasetUUID: uuid });
    // Abandon stale data, if a new call is made while loading data
    if (token !== loadToken) return;
    if (!result) {
      error.value = `Failed to load dataset ${uuid}`;
      return;
    }
    datasetUUID.value = uuid;
    dataset.value = result as DatasetWithData;
    const groups = Object.keys(result.data ?? {});
    entityGroup.value = groups[0] ?? null;
    // Ensures building WGS84 features is called in the right order
    try {
      await ensureProjection(dataset.value.epsg_code);
      if (token !== loadToken) return;
      initWgs84Features();
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  function initWgs84Features(): void {
    if (!dataset.value?.data) {
      wgs84Features.value = {};
      bridges.value = {};
      idIndex.value = {};
      nextId.value = {};
      return;
    }
    const epsg = dataset.value.epsg_code ?? null;
    const newBridges: Record<string, GeometryBridge> = {};
    const features: Record<string, Feature[]> = {};
    const index: Record<string, Map<number, number>> = {};
    const counters: Record<string, number> = {};

    for (const [groupName, groupData] of Object.entries(dataset.value.data)) {
      const bridge = createGeometryBridge(groupData, epsg);
      if (!bridge) continue;

      newBridges[groupName] = bridge;
      features[groupName] = bridge.entityDataToWgs84Features(groupData);

      const ids = groupData.id ?? [];
      const map = new Map<number, number>();
      let max = 0;
      for (const [i, id] of ids.entries()) {
        map.set(id, i);
        if (id > max) max = id;
      }
      index[groupName] = map;
      counters[groupName] = max + 1;
    }

    bridges.value = newBridges;
    wgs84Features.value = features;
    idIndex.value = index;
    nextId.value = counters;
  }

  function reindex(groupName: string) {
    const ids = (dataset.value?.data?.[groupName]?.["id"] as number[]) ?? [];
    const map = new Map<number, number>();
    for (const [i, id] of ids.entries()) map.set(id, i);
    idIndex.value = { ...idIndex.value, [groupName]: map };
  }

  function rowIndex(groupName: string, id: number) {
    return idIndex.value[groupName]?.get(id) ?? -1;
  }

  function getCurrentValue(groupName: string, id: number, prop: string): PatchValue {
    const groupData = dataset.value?.data?.[groupName] as Record<string, unknown[]> | undefined;
    const index = rowIndex(groupName, id);
    if (index === -1) return null;
    return ((groupData?.[prop] as unknown[])?.[index] ?? null) as PatchValue;
  }

  function getOriginalGeomColumns(groupName: string, id: number): GeometryData {
    const groupData = dataset.value?.data?.[groupName];
    const bridge = bridges.value[groupName];
    const dataIndex = rowIndex(groupName, id);
    if (!groupData || !bridge || dataIndex === -1) return {}; // -1 means new entity
    return bridge.getGeometryData(groupData, dataIndex);
  }

  function onGeometryEdit(
    groupName: string,
    updatedFeatures: Feature[],
    featureIndexes: number[],
    editType: string,
  ): void {
    // Update live features for visual feedback
    wgs84Features.value = { ...wgs84Features.value, [groupName]: updatedFeatures };

    // Commit to history and geometryChanges only on final editType
    const isFinal = ["finishMovePosition", "translated", "addPosition", "removePosition"].includes(
      editType,
    );
    if (!isFinal) return;

    const groupData = dataset.value?.data?.[groupName] as Record<string, unknown[]> | undefined;
    if (!groupData) return;

    const bridge = bridges.value[groupName];
    if (!bridge) return;

    for (const featureIndex of featureIndexes) {
      const feature = updatedFeatures[featureIndex];
      if (!feature) continue;
      const id = (feature as any).properties?.__id as number | undefined;
      if (id === undefined) continue;

      const newGeometryColumns = bridge.featureToGeometryData(feature);
      const oldGeometryColumns = getOriginalGeomColumns(groupName, id);

      // update geometryChanges
      if (!geometryChanges.value.has(groupName)) {
        geometryChanges.value.set(groupName, new Map());
      }
      const groupGeomChanges = geometryChanges.value.get(groupName)!;
      if (!groupGeomChanges.has(id)) {
        groupGeomChanges.set(id, {});
      }
      Object.assign(groupGeomChanges.get(id)!, newGeometryColumns);

      // Push to history
      historyStore.push({
        kind: "geometry",
        entityGroup: groupName,
        id,
        oldGeometryColumns,
        newGeometryColumns,
      });
    }
  }

  function applyGeometry(cmd: GeometryCommand, geomToApply: GeometryData) {
    // Checks if we are restoring the original geometry
    const isNew = newEntityIds.value.get(cmd.entityGroup)?.has(cmd.id) ?? false;
    const originalGeom = getOriginalGeomColumns(cmd.entityGroup, cmd.id);
    const isOriginal = !isNew && JSON.stringify(geomToApply) === JSON.stringify(originalGeom);

    if (isOriginal) {
      const groupGeomChanges = geometryChanges.value.get(cmd.entityGroup);
      groupGeomChanges?.delete(cmd.id);
    } else {
      //  Record/refresh the pending change
      if (!geometryChanges.value.has(cmd.entityGroup)) {
        geometryChanges.value.set(cmd.entityGroup, new Map());
      }
      const groupGeomChanges = geometryChanges.value.get(cmd.entityGroup)!;
      if (!groupGeomChanges.has(cmd.id)) {
        groupGeomChanges.set(cmd.id, {});
      }
      Object.assign(groupGeomChanges.get(cmd.id)!, geomToApply);
    }

    // Update wgs84Features for rendering
    const currentFeatures = wgs84Features.value[cmd.entityGroup];
    const featureIndex = rowIndex(cmd.entityGroup, cmd.id);
    if (currentFeatures && currentFeatures[featureIndex]) {
      const newGeom = bridges.value[cmd.entityGroup]?.geometryDataToGeometry(geomToApply);
      if (!newGeom) return;
      const updatedFeatures = [...currentFeatures];
      updatedFeatures[featureIndex] = {
        ...updatedFeatures[featureIndex],
        geometry: newGeom,
      } as unknown as Feature;
      wgs84Features.value = { ...wgs84Features.value, [cmd.entityGroup]: updatedFeatures };
    }
  }

  function selectEntityGroup(name: string) {
    entityGroup.value = name;
    selectedId.value = null;
    // Reset draw/delete/select modes when switching groups
    if (
      ["draw-point", "draw-line", "draw-polygon", "delete", "select-rectangle"].includes(
        editModeKey.value,
      )
    ) {
      editModeKey.value = "view";
    }
    multiSelectedIds.value = [];
  }

  function selectEntity(id: number) {
    selectedId.value = id;
  }

  function clearSelection() {
    selectedId.value = null;
    multiSelectedIds.value = [];
  }

  function setEditMode(mode: EditModeKey): void {
    editModeKey.value = mode;
    selectedId.value = null;
    if (mode !== "select-rectangle") {
      multiSelectedIds.value = [];
    }
  }

  function setMultiSelection(ids: number[]): void {
    multiSelectedIds.value = ids;
    // if exactly one entity selected, mirror into selectedId for the properties panel
    selectedId.value = ids.length === 1 ? ids[0]! : null;
  }

  function updateProperty(
    entityGroup: string,
    id: number,
    prop: string,
    newValue: unknown,
    skipHistory = false,
  ) {
    // Determine old value (from pending changes or original data)
    const pending = changes.value.get(entityGroup)?.get(id);
    const groupData = dataset.value?.data?.[entityGroup] as Record<string, unknown[]> | undefined;
    const dataIndex = rowIndex(entityGroup, id);
    const originalValue =
      dataIndex !== -1 ? (groupData?.[prop] as unknown[])?.[dataIndex] : undefined;
    const oldValue = pending?.[prop] !== undefined ? pending[prop] : originalValue;

    if (!changes.value.has(entityGroup)) {
      changes.value.set(entityGroup, new Map());
    }
    const groupChanges = changes.value.get(entityGroup)!;
    if (!groupChanges.has(id)) {
      groupChanges.set(id, {});
    }
    groupChanges.get(id)![prop] = newValue;

    if (!skipHistory) {
      historyStore.push({
        kind: "property",
        entityGroup,
        id,
        property: prop,
        oldValue,
        newValue,
      });
    }
  }

  function revertProperty(entityGroup: string, id: number, prop: string) {
    const groupChanges = changes.value.get(entityGroup);
    if (!groupChanges) return;
    const entityChanges = groupChanges.get(id);
    if (!entityChanges) return;
    delete entityChanges[prop];
    if (Object.keys(entityChanges).length === 0) {
      groupChanges.delete(id);
    }
  }

  function restoreEntity(params: {
    entityGroup: string;
    id: number;
    isNew: boolean;
    dataIndex: number;
    rowData: Record<string, unknown>;
    wgs84Feature: Feature | null;
    pendingChanges?: Record<string, unknown>;
    pendingGeometryChanges?: Record<string, unknown>;
  }) {
    const {
      entityGroup,
      id,
      isNew,
      dataIndex,
      rowData,
      wgs84Feature,
      pendingChanges = {},
      pendingGeometryChanges = {},
    } = params;

    // Restore the entity row into columnar data at its original index
    const groupData = dataset.value?.data?.[entityGroup] as Record<string, unknown[]> | undefined;
    if (groupData) {
      for (const [key, value] of Object.entries(rowData)) {
        if (groupData[key]) {
          (groupData[key] as unknown[]).splice(dataIndex, 0, value);
        }
      }
      reindex(entityGroup);
      triggerRef(dataset);
    }

    // Restore wgs84Feature at its original index
    if (wgs84Feature) {
      const currentFeatures = [...(wgs84Features.value[entityGroup] ?? [])];
      currentFeatures.splice(dataIndex, 0, wgs84Feature);
      wgs84Features.value = { ...wgs84Features.value, [entityGroup]: currentFeatures };
    }

    // Restore any pending property/geometry changes
    if (Object.keys(pendingChanges).length) {
      if (!changes.value.has(entityGroup)) changes.value.set(entityGroup, new Map());
      changes.value.get(entityGroup)!.set(id, { ...pendingChanges });
    }
    if (Object.keys(pendingGeometryChanges).length) {
      if (!geometryChanges.value.has(entityGroup))
        geometryChanges.value.set(entityGroup, new Map());
      geometryChanges.value.get(entityGroup)!.set(id, { ...pendingGeometryChanges });
    }

    // Restore tracking state
    if (isNew) {
      if (!newEntityIds.value.get(entityGroup)) newEntityIds.value.set(entityGroup, new Set());
      newEntityIds.value.get(entityGroup)!.add(id);
    } else {
      deletedEntityIds.value.get(entityGroup)?.delete(id);
    }
  }

  function undoPropertyChange(cmd: UpdatePropertyCommand) {
    const groupData = dataset.value?.data?.[cmd.entityGroup] as
      | Record<string, unknown[]>
      | undefined;
    const dataIndex = rowIndex(cmd.entityGroup, cmd.id);
    const originalValue =
      dataIndex !== -1 ? (groupData?.[cmd.property] as unknown[])?.[dataIndex] : undefined;

    if (cmd.oldValue === originalValue) {
      revertProperty(cmd.entityGroup, cmd.id, cmd.property);
    } else {
      updateProperty(cmd.entityGroup, cmd.id, cmd.property, cmd.oldValue, true);
    }
  }

  function createdEntitySnapshot(cmd: CreateCommand) {
    return {
      entityGroup: cmd.entityGroup,
      id: cmd.id,
      isNew: true,
      dataIndex: cmd.dataIndex,
      rowData: cmd.rowData,
      wgs84Feature: cmd.wgs84Feature,
      pendingGeometryChanges: cmd.geometryColumns,
    };
  }

  function undoCommand(cmd: Command) {
    switch (cmd.kind) {
      case "property":
        return undoPropertyChange(cmd);
      case "geometry":
        return applyGeometry(cmd, cmd.oldGeometryColumns);
      case "delete":
        return restoreEntity(cmd);
      case "create":
        return deleteEntity(cmd.entityGroup, cmd.id, true);
    }
  }

  function redoCommand(cmd: Command) {
    switch (cmd.kind) {
      case "property":
        return updateProperty(cmd.entityGroup, cmd.id, cmd.property, cmd.newValue, true);
      case "geometry":
        return applyGeometry(cmd, cmd.newGeometryColumns);
      case "delete":
        return deleteEntity(cmd.entityGroup, cmd.id, true);
      case "create":
        return restoreEntity(createdEntitySnapshot(cmd));
    }
  }

  function undo() {
    historyStore.undo(undoCommand);
  }
  function redo() {
    historyStore.redo(redoCommand);
  }

  async function save() {
    if (!datasetUUID.value || !isDirty.value) return;
    saving.value = true;
    error.value = null;
    // Preserve selection so the property panel stays open after reload
    const savedGroup = entityGroup.value;
    const savedId = selectedId.value;
    try {
      if (!flowStore.backend) {
        throw new Error("Backend not initialized");
      }
      if (!flowStore.hasCapability(CAPABILITIES.PATCH_DATASETS)) {
        throw new Error("Dataset patching is not supported by this backend");
      }
      if (!flowStore.backend.dataset.patch) {
        throw new Error("Dataset editor service is not configured");
      }
      await flowStore.backend.dataset.patch(datasetUUID.value, generatePatch());
      // Reload dataset to reflect the saved values
      await loadDataset(datasetUUID.value);
      // Restore selection -> loadDataset resets both to null
      entityGroup.value = savedGroup;
      selectedId.value = savedId;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      saving.value = false;
    }
  }

  function addEntity(groupName: string, newFeature: Feature): void {
    const groupData = dataset.value?.data?.[groupName] as Record<string, unknown[]> | undefined;
    if (!groupData) return;

    const bridge = bridges.value[groupName];
    if (!bridge) return;

    const newId = nextId.value[groupName] ?? 1;
    nextId.value = { ...nextId.value, [groupName]: newId + 1 };

    // extract geometry in dataset CRS
    const geomColumns = bridge.featureToGeometryData(newFeature);

    // record positions before inserting (for undo purposes)
    const index = (groupData["id"] as number[]).length;

    // Add new row to dataset columnar data
    (groupData["id"] as number[]).push(newId);
    for (const key of Object.keys(groupData)) {
      if (key === "id") continue;
      const geomValue = geomColumns[key];
      (groupData[key] as unknown[]).push(geomValue !== undefined ? geomValue : null);
    }
    reindex(groupName);
    triggerRef(dataset);

    // Update wgs84Features with the correct Id in properties
    const newFeatureWithId = {
      ...newFeature,
      properties: {
        ...(newFeature.properties ?? {}),
        __id: newId,
      },
    };
    const currentFeature = wgs84Features.value[groupName] ?? [];
    wgs84Features.value = {
      ...wgs84Features.value,
      [groupName]: [...currentFeature, newFeatureWithId],
    };

    // track geometry as changed
    if (!geometryChanges.value.has(groupName)) {
      geometryChanges.value.set(groupName, new Map());
    }
    geometryChanges.value.get(groupName)!.set(newId, { ...geomColumns });

    // track as new entity
    if (!newEntityIds.value.has(groupName)) {
      newEntityIds.value.set(groupName, new Set());
    }
    newEntityIds.value.get(groupName)!.add(newId);

    //Build the rowData snapshot for undo (all columns for this new entity)
    const rowData: Record<string, unknown> = {};
    for (const key of Object.keys(groupData)) {
      const arr = groupData[key] as unknown[];
      rowData[key] = arr[arr.length - 1]; // the value just pushed
    }

    // Push to history so the draw action can be undone
    historyStore.push({
      kind: "create",
      entityGroup: groupName,
      id: newId,
      dataIndex: index,
      rowData,
      wgs84Feature: newFeatureWithId,
      geometryColumns: { ...geomColumns },
    });

    // Select the new entity and switch back to the view mode
    entityGroup.value = groupName;
    selectedId.value = newId;
    editModeKey.value = "view";
  }

  const newAttributeTypes = ref<Map<string, Map<string, "number" | "boolean" | "string">>>(
    new Map(),
  );

  function addAttribute(
    groupName: string,
    name: string,
    type: "number" | "boolean" | "string",
  ): boolean {
    const groupData = dataset.value?.data?.[groupName] as Record<string, unknown[]> | undefined;
    const attr = name.trim();
    if (!groupData || !attr || attr === "id" || attr === "deleted" || attr.startsWith("geometry."))
      return false;
    if (attr in groupData) return false;
    const size = (groupData["id"] as unknown[])?.length ?? 0;
    groupData[attr] = new Array(size).fill(null);
    triggerRef(dataset);
    if (!newAttributeTypes.value.has(groupName)) newAttributeTypes.value.set(groupName, new Map());
    newAttributeTypes.value.get(groupName)!.set(attr, type);
    return true;
  }

  const newEntityGroups = ref<Set<string>>(new Set());

  function addEntityGroup(name: string, geometryType: GeometryType): boolean {
    const data = dataset.value?.data;
    const groupName = name.trim();
    if (!data || !groupName || groupName in data) return false;

    const group: EntityGroupData<unknown> = { id: [] };
    for (const col of DEFAULT_GEOMETRY_COLUMNS[geometryType]) group[col] = [];

    const bridge = createGeometryBridge(group, dataset.value?.epsg_code ?? null);
    if (!bridge) return false;

    data[groupName] = group;
    bridges.value = { ...bridges.value, [groupName]: bridge };
    idIndex.value = { ...idIndex.value, [groupName]: new Map() };
    nextId.value = { ...nextId.value, [groupName]: 1 };

    wgs84Features.value = { ...wgs84Features.value, [groupName]: [] };
    newEntityGroups.value.add(groupName);
    triggerRef(dataset);
    selectEntityGroup(groupName);
    return true;
  }

  function deleteEntity(groupName: string, id: number, skipHistory = false): void {
    // Capture snapshot before mutating (necessary for undo functionality)
    const groupData = dataset.value?.data?.[groupName] as Record<string, unknown[]> | undefined;
    let index = groupData ? rowIndex(groupName, id) : -1;
    const rowData: Record<string, unknown> = {};
    if (groupData && index !== -1) {
      for (const key of Object.keys(groupData)) {
        rowData[key] = (groupData[key] as unknown[])[index];
      }
    }
    const allFeatures = wgs84Features.value[groupName] ?? [];
    const wgs84Feature = index !== -1 ? (allFeatures[index] ?? null) : null;
    const pendingChanges = changes.value.get(groupName)?.get(id)
      ? { ...changes.value.get(groupName)!.get(id)! }
      : undefined;
    const pendingGeometryChanges = geometryChanges.value.get(groupName)?.get(id)
      ? { ...geometryChanges.value.get(groupName)!.get(id)! }
      : undefined;
    const isNew = newEntityIds.value.get(groupName)?.has(id) ?? false;

    // Remove the row from columnar dataset
    if (groupData && index !== -1) {
      for (const key of Object.keys(groupData)) {
        (groupData[key] as unknown[]).splice(index, 1);
      }
      reindex(groupName);
      triggerRef(dataset);
    }

    // Remove the feature from wgs84Features
    wgs84Features.value = {
      ...wgs84Features.value,
      [groupName]: allFeatures.filter((f) => (f as any).properties?.__id !== id),
    };

    // Discard any pending changes for this entity
    changes.value.get(groupName)?.delete(id);
    geometryChanges.value.get(groupName)?.delete(id);

    // If the entity was created in current session, no need to tell the backend.
    if (isNew) {
      newEntityIds.value.get(groupName)?.delete(id);
    } else {
      // Track for deletion in the next patch
      if (!deletedEntityIds.value.has(groupName)) {
        deletedEntityIds.value.set(groupName, new Set());
      }
      deletedEntityIds.value.get(groupName)!.add(id);
    }

    // Clear selection if entity was selected
    if (selectedId.value === id && entityGroup.value === groupName) {
      selectedId.value = null;
    }

    // Push to history of undo/redo works. Skip for redo replays
    // index === -1 means nothing was removed
    if (!skipHistory && index !== -1) {
      historyStore.push({
        kind: "delete",
        entityGroup: groupName,
        id,
        isNew,
        dataIndex: index,
        rowData,
        wgs84Feature,
        pendingChanges,
        pendingGeometryChanges,
      });
    }
    // Return to view mode after deletion
    editModeKey.value = "view";
  }

  function clearChanges() {
    changes.value = new Map();
    geometryChanges.value = new Map();
    newEntityIds.value = new Map();
    deletedEntityIds.value = new Map();
    historyStore.clear();

    // Drop entity groups created in a session before rebuilding state
    const data = dataset.value?.data;
    if (data) {
      for (const groupName of newEntityGroups.value) {
        delete data[groupName];
        if (entityGroup.value === groupName) entityGroup.value = null;
      }
      triggerRef(dataset);
    }
    newEntityGroups.value = new Set();

    // Reset wgs84Features from original dataset
    initWgs84Features();
    // Delete new attributes from groupData
    for (const [groupName, attrs] of newAttributeTypes.value) {
      const groupData = dataset.value?.data?.[groupName] as Record<string, unknown[]> | undefined;
      if (groupData) for (const attr of attrs.keys()) delete groupData[attr];
    }
    newAttributeTypes.value = new Map();
  }

  return {
    datasetUUID,
    dataset,
    entityGroup,
    selectedId,
    changes,
    geometryChanges,
    wgs84Features,
    newEntityIds,
    newAttributeTypes,
    multiSelectedIds,
    saving,
    error,
    editModeKey,
    editMode,
    entityGroupNames,
    selectedEntity,
    boundingBox,
    currentGroupGeometryType,
    isDirty,
    dirtyCount,
    generatePatch,
    loadDataset,
    onGeometryEdit,
    addEntity,
    addAttribute,
    addEntityGroup,
    deleteEntity,
    setEditMode,
    setMultiSelection,
    selectEntityGroup,
    selectedIsNew,
    selectEntity,
    clearSelection,
    updateProperty,
    undo,
    redo,
    save,
  };
});
