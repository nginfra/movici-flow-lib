<template>
  <div class="property-editor">
    <div v-if="!entity" class="has-text-grey is-size-7 p-4">Select an entity on the map</div>
    <div v-else>
      <div
        v-for="(value, key) in editableProperties"
        :key="key"
        class="property-row is-flex is-align-items-center mb-2"
      >
        <span
          class="property-key is-size-7 has-text-grey-dark mr-2"
          :title="String(key)"
          :class="{ 'has-text-warning-dark has-text-weight-bold': isModified(String(key)) }"
        >
          {{ String(key) }}
          <span v-if="isModified(String(key))">*</span>
        </span>
        <div class="is-flex-grow-1">
          <o-select
            v-if="inputKind(String(key)) === 'enum'"
            :model-value="currentValue(String(key))"
            @update:model-value="(v: unknown) => emit('change', String(key), Number(v))"
            size="small"
          >
            <option
              v-for="(label, index) in getEnumOptions(String(key))"
              :key="index"
              :value="index"
            >
              {{ label }}
            </option>
          </o-select>
          <o-switch
            v-else-if="inputKind(String(key)) === 'boolean'"
            :model-value="Boolean(currentValue(String(key)))"
            @update:model-value="(v: boolean) => emit('change', String(key), v)"
            size="small"
          />
          <o-input
            v-else-if="inputKind(String(key)) === 'number'"
            type="number"
            :model-value="displayValue(String(key))"
            @change="(e: Event) => onNumberChange(String(key), e)"
            size="small"
          />
          <!-- Read only: entity identity and geometry -->
          <span
            v-else-if="inputKind(String(key)) === 'readonly'"
            class="is-size-7 has-text-grey is-family-monospace"
            :title="isGeometry(String(key)) ? String(currentGeometryValue(String(key))) : undefined"
          >
            {{ isGeometry(String(key)) ? geometryDisplay(String(key)) : displayValue(String(key)) }}
          </span>
          <!-- Fallback (string) -->
          <o-input
            v-else
            type="text"
            :model-value="displayValue(String(key))"
            @change="
              (e: Event) => emit('change', String(key), (e.target as HTMLInputElement).value)
            "
            size="small"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEditorStore } from "@movici-flow-lib/stores/editor";

const props = defineProps<{
  entity: Record<string, unknown> | null;
  entityGroup: string | null;
  generalEnums: Record<string, string[]>;
  enumNames: Record<string, string>; // PropNames become enumNames
}>();

const emit = defineEmits<{
  (e: "change", prop: string, value: unknown): void;
}>();

const store = useEditorStore();
const editableProperties = computed(() => {
  return props.entity ?? {};
});

function isGeometry(key: string): boolean {
  return key.startsWith("geometry.");
}

/** Data type of a column, derived from the COLUMN data
 * new entities are null-padded (`addEntity`), so dispatching on the row's
 * cell value would send every attribute of a drawn entity through the text
 * fallback and store strings into numeric columns. */
function columnType(key: string): "number" | "boolean" | "string" | null {
  if (!props.entityGroup) return null;
  const groupData = store.dataset?.data?.[props.entityGroup] as
    | Record<string, unknown[]>
    | undefined;
  const column = groupData?.[key];
  if (!column) return null;
  for (const v of column) {
    if (v === null || v === undefined) continue;
    const t = typeof v;
    return t === "number" || t === "boolean" || t === "string" ? t : null;
  }
  return store.newAttributeTypes.get(props.entityGroup)?.get(key) ?? null;
}

function inputKind(key: string): "enum" | "boolean" | "number" | "readonly" | "text" {
  if (key === "id" || isGeometry(key)) return "readonly";
  if (getEnumOptions(key)) return "enum";
  const t = columnType(key);
  if (t === "boolean") return "boolean";
  if (t === "number") return "number";
  return "text";
}

function displayValue(key: string): string {
  if (key == "id" && store.selectedIsNew) return "-"; // new entities get an Id from the backend.
  const v = currentValue(key);
  return v === null || v === undefined ? "" : String(v);
}

/** Geometry values have their pending edits tracked in
 * geometryChanges (fed by the map tools), so read those before the original data. */
function currentGeometryValue(key: string): unknown {
  if (props.entityGroup && store.selectedId !== null) {
    const pending = store.geometryChanges.get(props.entityGroup)?.get(store.selectedId);
    if (pending && key in pending) return pending[key];
  }
  return currentValue(key);
}

function geometryDisplay(key: string): string {
  const v = currentGeometryValue(key);
  if (v === null || v === undefined) return "";
  // Point coordinates (geometry.x / geometry.y) are plain numbers: show them
  // truncated to 2 decimals (full precision is in the title tooltip)
  if (typeof v === "number") return v.toFixed(2);
  // For Linestring/polygon columns show a compact summary
  if (Array.isArray(v)) return `[${v.length} vertices]`;
  return "[geometry]";
}

function onNumberChange(key: string, e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  // Empty input clears the value (null); otherwise preserve the numeric type
  emit("change", key, raw === "" ? null : Number(raw));
}

function isModified(key: string): boolean {
  if (!props.entityGroup || store.selectedId === null) return false;
  const pending = store.changes.get(props.entityGroup)?.get(store.selectedId);
  if (pending !== undefined && key in pending) return true;
  const pendingGeom = store.geometryChanges.get(props.entityGroup)?.get(store.selectedId);
  return pendingGeom !== undefined && key in pendingGeom;
}

function currentValue(key: string): unknown {
  if (!props.entityGroup || store.selectedId === null) return props.entity?.[key];
  const pending = store.changes.get(props.entityGroup)?.get(store.selectedId);
  if (pending && key in pending) return pending[key];
  return props.entity?.[key];
}

function getEnumOptions(key: string): string[] | null {
  const enumName = props.enumNames[key];
  if (!enumName) return null;
  return props.generalEnums[enumName] ?? null;
}
</script>

<style scoped lang="scss">
.property-editor {
  overflow-y: auto;
}
.property-row {
  gap: 0.5rem;
  .property-key {
    min-width: 140px;
    max-width: 140px;
    word-break: break-all;
    flex-shrink: 0;
  }
}
</style>
