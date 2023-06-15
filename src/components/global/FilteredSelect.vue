<template>
  <o-select
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :placeholder="warning ? warning : $t('actions.select')"
    size="small"
    expanded
    :disabled="disabled"
  >
    <option
      v-for="(val, index) in options"
      :disabled="!filterValue(val as T)"
      :class="{ 'attribute-option-disabled': !filterValue(val as T) }"
      :value="val"
      :key="index"
      :title="doGetTitle(val as T)"
    >
      {{ getDisplayName(val as T) }}
    </option>
  </o-select>
</template>

<script setup lang="ts" generic="T extends unknown">
import { computed } from "vue";
export interface Props<T> {
  modelValue?: T;
  options?: T[];
  filterVal?: (val: T) => boolean;
  displayName?(val: T): string;
  getTitle?: (val: T) => string;
  warningMessage?: string;
  disabled?: boolean;
}

// TODO: generic typing bug prevents propagation of T
const props = defineProps<Props<unknown>>();

const emit = defineEmits<{
  (e: "update:modelValue", val: T): void;
}>();

function filterValue(val: T): boolean {
  return props.filterVal?.(val) ?? true;
}
function doGetTitle(val: T): string {
  if (props.getTitle) {
    return props.getTitle(val);
  }
  const displayName = getDisplayName(val);
  if (typeof displayName === "string") {
    return displayName;
  }
  return "";
}

function getDisplayName(val: T): string | T {
  return props.displayName?.(val) ?? val;
}

const warning = computed(() => {
  return props.options?.filter((val) => filterValue(val as T)).length === 0
    ? props.warningMessage
    : null;
});
</script>

<style scoped lang="scss"></style>
