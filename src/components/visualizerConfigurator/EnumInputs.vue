<template>
  <div>
    <div
      v-for="(val, index) in modelValue"
      class="field is-align-items-center"
      :key="index"
      size="small"
    >
      <div class="is-flex">
        <slot name="before" v-bind="{ index }" />
        <span class="is-flex-grow-1 values-from">
          <o-input :modelValue="labels[val]" size="small" disabled />
        </span>
        <slot name="after" v-bind="{ index }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: number[];
  enumLabels?: string[] | null;
}>();

const labels = computed(() => props.enumLabels ?? props.modelValue.map(String));
</script>
<style lang="scss" scoped>
:deep(.control) {
  line-height: 1.5rem;
}
</style>
