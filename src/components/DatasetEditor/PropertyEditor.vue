<template>
  <div class="property-editor">
    <div v-if="!entityGroup" class="has-text-grey is-size-7 p-4">Select an entity group</div>
    <div v-else-if="!hasSelection" class="has-text-grey is-size-7 p-4">
      Select one or more features on the map
    </div>
    <div v-else>
      <div
        v-for="key in attributes"
        :key="key"
        class="property-row is-flex is-align-items-center mb-2"
      >
        <o-button
          v-if="!store.isRestricted(key)"
          class="delete-attribute"
          icon-left="trash"
          icon-pack="fas"
          size="small"
          variant="white"
          :title="`Delete attribute '${key}'`"
          @click="emit('delete-attribute', key)"
        />
        <span v-else class="delete-attribute-spacer" />

        <span
          class="property-key is-size-7 has-text-grey-dark mr-2"
          :title="key"
          :class="{ 'has-text-warning-dark has-text-weight-bold': isModified(key) }"
        >
          {{ key }}
          <span v-if="isModified(String(key))">*</span>
        </span>

        <div class="is-flex-grow-1">
          <o-select
            v-if="inputKind(String(key)) === 'enum'"
            :model-value="currentValue(String(key))"
            @update:model-value="(v: unknown) => emit('change', String(key), Number(v))"
            size="small"
          >
            <option v-if="isMulti" :value="undefined" disabled>new value</option>
            <option
              v-for="(label, index) in getEnumOptions(String(key))"
              :key="index"
              :value="index"
            >
              {{ label }}
            </option>
          </o-select>
          <o-select
            v-else-if="inputKind(key) === 'boolean' && isMulti"
            :model-value="boolSelectValue(key)"
            @update:model-value="(v: string) => v !== '' && emit('change', key, v === 'true')"
            size="small"
          >
            <option value="" disabled>new value</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </o-select>
          <!-- Single selection -->
          <o-switch
            v-else-if="inputKind(key) === 'boolean'"
            :model-value="Boolean(currentValue(key))"
            @update:model-value="(v: boolean) => emit('change', key, v)"
            size="small"
          />
          <o-input
            v-else-if="inputKind(String(key)) === 'number'"
            type="number"
            :step="isIntegerColumn(String(key)) ? '1' : 'any'"
            :model-value="displayValue(String(key))"
            @change="(e: Event) => onNumberChange(String(key), e)"
            size="small"
            :placeholder="isMulti ? 'new value' : undefined"
          />
          <span
            v-else-if="inputKind(key) === 'readonly'"
            class="is-size-7 has-text-grey is-family-monospace"
          >
            {{
              isMulti ? "-" : isGeometryAttribute(key) ? geometryDisplay(key) : displayValue(key)
            }}
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
            :placeholder="isMulti ? 'new value' : undefined"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  attributeValueKind,
  useEditorStore,
  type AttributeValueKind,
  type AttributeValueType,
} from "@movici-flow-lib/stores/editor";
import { isGeometryAttribute } from "@movici-flow-lib/utils/editorAttributes";

const props = defineProps<{
  entity: Record<string, unknown> | null;
  entityGroup: string | null;
  attributes: string[];
  selectedIds: number[]; // edits apply only to these ids.
  generalEnums: Record<string, string[]>;
  enumNames: Record<string, string>; // Property names
}>();

const emit = defineEmits<{
  (e: "change", prop: string, value: unknown): void;
  (e: "delete-attribute", prop: string): void;
}>();

const isMulti = computed(() => props.selectedIds.length > 1);
const hasSelection = computed(() => props.selectedIds.length > 0);

const store = useEditorStore();

function declaredType(key: string): AttributeValueType | null {
  if (!props.entityGroup) return null;
  return store.newAttributeTypes.get(props.entityGroup)?.get(key) ?? null;
}

function isIntegerColumn(key: string): boolean {
  return declaredType(key) === "integer";
}

/** Data type of a column, derived from the COLUMN data
 * new entities are null-padded (`addEntity`), so dispatching on the row's
 * cell value would send every attribute of a drawn entity through the text
 * fallback and store strings into numeric columns. */
function columnType(key: string): AttributeValueKind | null {
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
  const declared = declaredType(key);
  return declared ? attributeValueKind(declared) : null;
}

function boolSelectValue(key: string) {
  const v = commonPendingValue(key);
  return v === undefined ? "" : String(Boolean(v));
}

function inputKind(key: string): "enum" | "boolean" | "number" | "readonly" | "text" {
  if (store.isRestricted(key)) return "readonly";
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
  // Point coordinates (geometry.x / geometry.y) are plain numbers
  // we truncated to 2 decimals
  if (typeof v === "number") return v.toFixed(2);
  // For Linestring/polygon columns show a compact summary
  if (Array.isArray(v)) return `[${v.length} vertices]`;
  return "[geometry]";
}

function onNumberChange(key: string, e: Event) {
  const input = e.target as HTMLInputElement;
  const raw = input.value;
  // Empty input clears the value (null); otherwise preserve the numeric type
  if (raw === "") {
    emit("change", key, null);
    return;
  }
  let value = Number(raw);
  if (isIntegerColumn(key)) {
    value = Math.round(value);
    input.value = String(value);
  }
  emit("change", key, value);
}

function isModified(key: string): boolean {
  if (!props.entityGroup) return false;
  if (isMulti.value) {
    const groupChanges = store.changes.get(props.entityGroup);
    return props.selectedIds.some((id) => {
      const pending = groupChanges?.get(id);
      return pending !== undefined && key in pending;
    });
  }
  if (!props.entityGroup || store.selectedId === null) return false;
  const pending = store.changes.get(props.entityGroup)?.get(store.selectedId);
  if (pending !== undefined && key in pending) return true;
  const pendingGeom = store.geometryChanges.get(props.entityGroup)?.get(store.selectedId);
  return pendingGeom !== undefined && key in pendingGeom;
}

function currentValue(key: string): unknown {
  if (isMulti.value) return commonPendingValue(key);
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

function commonPendingValue(key: string): unknown {
  if (!props.entityGroup) return undefined;
  const groupChanges = store.changes.get(props.entityGroup);
  if (!groupChanges) return undefined;
  let common: unknown;
  let seen = false;
  for (const id of props.selectedIds) {
    const pending = groupChanges.get(id);
    if (!pending || !(key in pending)) return undefined;
    if (!seen) {
      common = pending[key];
      seen = true;
    } else if (pending[key] !== common) return undefined;
  }
  return seen ? common : undefined;
}
</script>

<style scoped lang="scss">
.property-editor {
  overflow-y: auto;
}
.property-row {
  gap: 0.5rem;
  .property-key {
    min-width: 120px;
    max-width: 120px;
    word-break: break-all;
    flex-shrink: 0;
  }
}
.delete-attribute,
.delete-attribute-spacer {
  width: 1.75rem;
  flex-shrink: 0;
}
</style>
