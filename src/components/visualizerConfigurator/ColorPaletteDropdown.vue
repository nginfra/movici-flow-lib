<template>
  <o-field class="is-flex-grow-1 ml-2" :label="$t('flow.visualization.colorConfig.palette')">
    <o-dropdown
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      class="select is-small"
      aria-role="list"
      expanded
    >
      <template #trigger>
        <span class="color-option">
          <o-tooltip variant="black" position="top" :label="currentName">
            <span
              class="color-piece is-size-7"
              v-for="(color, index) in currentColors"
              :style="{ 'background-color': color }"
              :key="index"
            ></span>
          </o-tooltip>
        </span>
      </template>
      <o-dropdown-item
        class="color-option"
        v-for="[index, palette] in validPalettes"
        :value="index"
        :key="index"
        :focusable="false"
        aria-role="listitem"
      >
        <o-tooltip variant="black" position="top" :label="palette.name">
          <span
            class="color-piece"
            v-for="(color, index) in palette.getHexColorsForSize(nSteps)"
            :style="{ 'background-color': color }"
            :key="index"
          />
        </o-tooltip>
      </o-dropdown-item>
    </o-dropdown>
  </o-field>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type ColorPalette from "./colorPalettes";

const props = withDefaults(
  defineProps<{
    modelValue?: number | null;
    nSteps?: number;
    colorPalettes?: ColorPalette[];
    filter?: (palette: ColorPalette) => boolean;
  }>(),
  { nSteps: 2, colorPalettes: () => [], filter: () => true }
);

const currentName = computed(() => {
  return props.modelValue != null ? props.colorPalettes[props.modelValue].name : "Select a palette";
});
const currentColors = computed(() => {
  return props.modelValue != null
    ? props.colorPalettes[props.modelValue].getHexColorsForSize(props.nSteps)
    : [];
});
const validPalettes = computed(() => {
  return Array.from(props.colorPalettes.entries()).filter((entry) => {
    return props.filter(entry[1]);
  });
});
</script>
<style lang="scss" scoped>
:deep(.dropdown) {
  &.is-active {
    border-color: $primary;
    box-shadow: 0 0 0 0.125em rgba($primary, 0.25);
  }
  .dropdown-trigger {
    @include border-radius;
    cursor: pointer;
    border: 2px solid $white-ter;
    line-height: unset;
    background-color: $white;
    user-select: none;
    .color-option {
      .tooltip-trigger {
        padding: 10px 20px 10px 0 !important;
      }
    }
    &:hover {
      border-color: $grey-light;
      &::after {
        border-color: $grey-darker;
      }
    }
  }

  .color-option {
    display: block;
    line-height: 6px;
    text-align: center;
    height: 28px;
    padding: 0;

    .b-tooltip {
      width: 100%;
      height: 28px;
      .tooltip-content {
        line-height: initial !important;
      }
      .tooltip-trigger {
        padding: 10px 0;
      }
    }
    &.is-active {
      background-color: unset;
    }
    span.color-piece {
      height: 8px;
      width: 16px;
      display: inline-block;
    }
  }
}
</style>
