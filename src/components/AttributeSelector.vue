<template>
  <MovFilteredSelect
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :options="attributes ?? []"
    :getTitle="(val: AttributeType) => val.description"
    :displayName="(val: AttributeType) => val.name"
    :filterVal="attributeFilter"
    :disabled="disabled"
  />
</template>

<script setup lang="ts">
import type { AttributeType } from "@movici-flow-lib/types";

defineProps<{
  modelValue?: AttributeType;
  attributes?: AttributeType[];
  disabled?: boolean;
  attributeFilter?(attr: AttributeType): boolean;
}>();
</script>
