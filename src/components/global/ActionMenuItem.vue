<template>
  <div class="item">
    <component v-if="modelValue.component" :is="modelValue.component" />
    <a
      v-else
      :focusable="false"
      :disabled="modelValue.isDisabled"
      :class="itemClass(modelValue)"
      @click.stop="doEmit(modelValue.event)"
      class="dropdown-item"
    >
      <o-icon :icon="modelValue.icon" :pack="modelValue.iconPack || 'far'" class="mr-2"></o-icon>
      <span>
        {{ modelValue.label }}
      </span>
    </a>
  </div>
</template>

<script setup lang="ts">
import type { ActionItem } from "@movici-flow-lib/types";

defineProps<{
  modelValue: ActionItem;
}>();

const emit = defineEmits<{
  (e: "action", action: string): void;
  (e: string): void;
}>();

function itemClass(item: ActionItem) {
  const rv = [item.variant];
  if (item.isDisabled) rv.push("is-disabled");
  return rv;
}

function doEmit(action: string) {
  emit("action", action);
  emit(action);
}
</script>

<style scoped lang="scss">
.dropdown-item {
  font-size: 0.8rem;
  font-weight: 300;
  &.danger {
    --dropdown-selected: #{$danger};
    --dropdown-selected-bg: #{$danger-invert};
  }
  &.warning {
    --dropdown-selected: #{$warning};
    --dropdown-selected-bg: #{$warning-invert};
  }
}
</style>
