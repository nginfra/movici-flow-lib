<template>
  <div class="suggestions is-flex is-align-items-center" v-if="unusedSuggestions.length">
    <span class="is-size-7 has-text-weight-bold has-text-grey mr-1">
      {{ $t("flow.visualization.popup.suggestions") }}:
    </span>
    <MovTag
      v-for="(suggestion, idx) in unusedSuggestions"
      class="is-clickable has-hover-bg"
      :class="{ 'mr-2': idx !== unusedSuggestions.length - 1 }"
      :key="idx"
      @click="$emit('addItem', suggestion)"
      :title="suggestion.description"
    >
      {{ suggestion.name }}
      <o-icon class="ml-1" size="small" icon="plus-circle" pack="fal" />
    </MovTag>
  </div>
</template>

<script setup lang="ts">
import type { AttributeSummary, PopupItem } from "@movici-flow-lib/types";
import { sortByKeys } from "@movici-flow-lib/utils";
import { computed, inject } from "vue";
import { attributesInjection } from "./injectionKeys";

const props = withDefaults(
  defineProps<{
    modelValue: AttributeSummary[];
    items?: PopupItem[];
    defaultSuggestionNames?: string[];
  }>(),
  {
    defaultSuggestionNames: () => ["id", "display_name", "name", "reference"],
  }
);

const attributes = inject(attributesInjection)!;

const defaultSuggestionNamesSet = computed(() => new Set(props.defaultSuggestionNames));
const usedAttributes = computed(() => new Set(props.items?.map((i) => i.attribute.name)));

const defaultSuggestions = computed(
  () => attributes.value?.filter((attr) => defaultSuggestionNamesSet.value.has(attr.name)) ?? []
);

const unusedSuggestions = computed(() => {
  return [...defaultSuggestions.value, ...props.modelValue]
    .filter((attr) => {
      return !usedAttributes.value.has(attr.name);
    })
    .sort(sortByKeys(["+name"]));
});
</script>

<style scoped lang="scss"></style>
