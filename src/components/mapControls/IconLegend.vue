<template>
  <ul class="shape-container is-size-7">
    <li class="icons" v-for="(iconLegend, idx) in modelValue.entries" :key="idx">
      <div class="is-flex pb-1" :class="isStatic ? 'static' : 'byValue'">
        <span class="is-flex is-align-items-center">
          <o-icon :icon="iconLegend[1]" pack="fas" size="small" class="is-flex-grow-1" />
          <span class="ml-2 legend-value" v-if="!isStatic">{{ iconLegend[0] }}</span>
        </span>
        <label class="label is-size-7 mb-0" :class="{ 'ml-2': isStatic }" v-if="idx < 1">
          {{ $t("flow.visualization.iconConfig." + modelValue.kind) }}
        </label>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { IconLegendItem } from "@movici-flow-lib/types";
import { computed } from "vue";

const props = defineProps<{
  modelValue: IconLegendItem;
}>();

const isStatic = computed(() => {
  return (props.modelValue.entries.length ?? []) === 1;
});
</script>

<style scoped lang="scss">
ul {
  li {
    .static {
      flex-direction: row;
      align-items: center;
    }
    .byValue {
      flex-direction: column-reverse;
      align-items: flex-start;
    }
    span {
      &.legend-value {
        line-height: 16px;
      }
    }
  }
}
</style>
