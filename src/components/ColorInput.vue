<template>
  <div class="color-input">
    <span
      class="color-box"
      :class="{ active: showColorPicker }"
      :style="{ 'background-color': hexColor }"
      @click="showColorPicker = !showColorPicker"
    ></span>
    <span v-if="caret" class="caret" />
    <FlowColorPicker
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :presets="colorPickerPresets"
      :open="showColorPicker"
      @close="showColorPicker = false"
      :translateX="translate[0]"
      :translateY="translate[1]"
      :position="colorPickerPosition"
    />
  </div>
</template>

<script setup lang="ts">
import type { RGBAColor } from "@movici-flow-common/types";
import { colorTripleToHex, MoviciColors } from "@movici-flow-common/visualizers/maps/colorMaps";
import FlowColorPicker from "./FlowColorPicker.vue";
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: RGBAColor;
    caret?: boolean;
    colorPickerPosition?: "top" | "right" | "top-right";
  }>(),
  {
    colorPickerPosition: "right",
  }
);

const colorPickerPresets = Object.values(MoviciColors);
const showColorPicker = ref(false);

const hexColor = computed(() =>
  props.modelValue ? colorTripleToHex(props.modelValue) : MoviciColors.VERY_DARK_GREY
);

const translate = computed(() => {
  switch (props.colorPickerPosition) {
    case "top":
      return [-1, -30];
    case "right":
      return [props.caret ? 64 : 44, -10];
    case "top-right":
      return [32, -12];
    default:
      return [0, 0];
  }
});
</script>

<style lang="scss" scoped>
.color-input {
  .color-box {
    @include border-radius;
    cursor: pointer;
    border: 2px solid $white-ter;
    min-width: 30px;
    height: 30px;
    // line-height: unset;
    display: inline-block;
    margin-bottom: -9px;
    &.active {
      border-color: $primary;
    }
  }
  .caret {
    position: absolute;
    width: 0;
    height: 0;
    top: 9px;
    right: -8px;
    border: 4px solid $black;
    border-color: $grey-lightest $grey-lightest transparent transparent;
    transform-origin: 0 0;
    transform: rotate(45deg);
  }
  &:hover {
    .caret {
      border-color: $grey-light $grey-light transparent transparent;
    }
    .color-box {
      border-color: $grey-light;
    }
  }
}
</style>
