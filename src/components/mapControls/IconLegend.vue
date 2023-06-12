<template>
  <div class="shape-icon-container">
    <ul class="shape-container is-size-7" v-if="modelValue.shape">
      <li class="icons" v-for="(iconLegend, idx) in modelValue.shape.iconLegends" :key="idx">
        <div class="is-flex pb-1" :class="isShapeStatic ? 'static' : 'byValue'">
          <span class="is-flex is-align-items-center">
            <o-icon :icon="iconLegend[1]" pack="fas" size="small" class="is-flex-grow-1" />
            <span class="ml-2 legend-value" v-if="!isShapeStatic">{{ iconLegend[0] }}</span>
          </span>
          <label class="label is-size-7 mb-0" :class="{ 'ml-2': isShapeStatic }" v-if="idx < 1">
            {{ $t("flow.visualization.iconConfig.shape") }}
          </label>
        </div>
      </li>
    </ul>
    <ul class="icon-container is-size-7" v-if="modelValue.icon">
      <li class="icons" v-for="(iconLegend, idx) in modelValue.icon.iconLegends" :key="idx">
        <div class="is-flex pb-1" :class="isIconStatic ? 'static' : 'byValue'">
          <span class="is-flex is-align-items-center">
            <o-icon :icon="iconLegend[1]" pack="fas" size="small" class="is-flex-grow-1" />
            <span class="ml-2 legend-value" v-if="!isIconStatic">{{ iconLegend[0] }}</span>
          </span>
          <label class="label is-size-7 mb-0" :class="{ 'ml-2': isIconStatic }" v-if="idx < 1">
            {{ $t("flow.visualization.iconConfig.icon") }}
          </label>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { IconShapeLegendItem } from "@movici-flow-common/types";
import { computed } from "vue";

const props = defineProps<{
  modelValue: IconShapeLegendItem;
}>();

const isShapeStatic = computed(() => {
  return (props.modelValue.shape?.iconLegends.length ?? []) === 1;
});

const isIconStatic = computed(() => {
  return (props.modelValue.icon?.iconLegends.length ?? []) === 1;
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
