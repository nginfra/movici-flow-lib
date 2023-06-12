<template>
  <WidgetContainer class="p-0">
    <DataViewContent
      :modelValue="modelValue?.content"
      :timestamp="timestamp"
      :class="accentClass"
      class="p-3"
      @togglePosition="$emit('toggle')"
      @close="$emit('close')"
      closable
    />
  </WidgetContainer>
</template>

<script setup lang="ts">
import type { PopupInfo } from "@movici-flow-common/types";
import { computed } from "vue";
import DataViewContent from "./DataViewContent.vue";
import WidgetContainer from "./WidgetContainer.vue";

const props = defineProps<{
  modelValue?: PopupInfo;
  timestamp?: number;
}>();

const accentClass = computed(() =>
  props.modelValue?.accent ? "is-" + props.modelValue.accent : undefined
);
</script>

<style lang="scss" scoped>
:deep(.data-content) {
  border-radius: 6px;
  border: 2px solid transparent;
  .attributes,
  .label {
    color: $black !important;
  }
  &.is-weak {
    .attributes,
    .label {
      color: $grey-dark !important;
    }
  }
  &.is-strong {
    border-color: $primary;
    box-shadow: transparentize($primary, 0.5) 0px 0px 5px 0px,
      transparentize($primary, 0.5) 0px 0px 1px 0px;
    .attributes,
    .label {
      color: $black !important;
    }
  }
}
</style>
