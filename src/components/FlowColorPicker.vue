<template>
  <div
    v-if="isOpen"
    class="color-picker-container"
    :class="position"
    ref="colorPickerContainer"
    :style="positionStyle"
    tabindex="0"
    @focusout="handleFocusOut($event)"
  >
    <Sketch v-model="rgba" :presetColors="preparedColorPresets" />
  </div>
</template>

<script setup lang="ts">
import { Sketch } from "@ckpack/vue-color";
import type { RGBAColor } from "@movici-flow-lib/types";
import { DEFAULT_UNDEFINED_COLOR_TRIPLE } from "@movici-flow-lib/utils/colorUtils";
import { computed, nextTick, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: RGBAColor;
    presets?: (RGBAColor | string)[];
    open?: boolean;
    translateX?: number;
    translateY?: number;
    position: "top" | "right" | "top-right";
  }>(),
  {
    modelValue: () => DEFAULT_UNDEFINED_COLOR_TRIPLE,
    presets: () => [],
    translateX: 0,
    translateY: 0,
    position: "right",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: RGBAColor): void;
  (e: "close"): void;
}>();

const colorPickerContainer = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const coolDown = ref(false);

// typing of the Sketch component is incorrect so we need to circumvent it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const preparedColorPresets = computed<any>(() => {
  return props.presets.map((color) => (Array.isArray(color) ? colorTripleToRGBA(color) : color));
});

const positionStyle = computed(() => {
  const transform = {
    top: "translateY(-100%) translateY(-10px)",
    right: "translateY(-50%)",
    "top-right": "translateY(-48px) translateX(12px)",
  }[props.position];

  return {
    transform: transform + `translateY(${props.translateY}px) translateX(${props.translateX}px)`,
  };
});

// typing of the Sketch component is incorrect so we need to circumvent it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rgba = computed<any>({
  get: () => colorTripleToRGBA(props.modelValue),
  set: ({ rgba }) => {
    const color: RGBAColor = [rgba.r, rgba.g, rgba.b];
    if (rgba.a < 1) {
      color[3] = Math.floor(rgba.a * 255);
    }
    emit("update:modelValue", color);
  },
});

function colorTripleToRGBA(color: RGBAColor) {
  return {
    rgba: {
      r: color[0],
      g: color[1],
      b: color[2],
      a: color[3] !== undefined ? color[3] / 255 : 1,
    },
  };
}

watch(
  () => props.open,
  (open: boolean) => {
    /* We need to handle the blur event correctly. This means that we first have to focus the
    colorPickerContainer when it appears, so that clicking outside it's area, actually triggers
    the blur event. Because of Vue reasons, this needs to be done in a $nextTick callback.
    Now that we're properly detecting the blur event, we need to deal with a false positive, namely
    when we use an (outside this component) toggle button to close it. Clicking the toggle button
    first fires the blur event (thereby closing this component) and then it is activated again in
    the toggle action, which is undesirable. We therefore introduce a cooldown. If the component
    has been closed, it cannot be opened again within x(=100) ms.
    */
    const COOLDOWN_MS = 100;
    if (open && coolDown.value) {
      emit("close");
    }

    isOpen.value = open;

    if (open) {
      nextTick(() => {
        colorPickerContainer.value?.focus();
      });
    } else if (!coolDown.value) {
      coolDown.value = true;
      setTimeout(() => {
        coolDown.value = false;
      }, COOLDOWN_MS);
    }
  }
);
function handleFocusOut(event: FocusEvent) {
  // when clicking outside the color picker we want to close it. We need to capture the focusout
  // and then emit the close event. However, there are multiple children inside the color picker
  // that may trigger the focusout event, so we need to check whether we've actually focused
  // outside the picker, or merely on a child.
  // Also, we choose to use the focusout event and not the blur event since the focusout event
  // bubbles up so that we can also capture it after we've focused on a child

  const currentTarget = event.currentTarget as
    | (EventTarget & {
        contains: (e: Element | null) => boolean;
      })
    | null;
  // Give browser time to focus the next element
  requestAnimationFrame(() => {
    // Check if the new focused element is a child of the original container
    if (!currentTarget?.contains(document.activeElement)) {
      emit("close");
    }
  });
}
</script>

<style scoped lang="scss">
.color-picker-container {
  outline: none;
  position: absolute !important;
  z-index: 5;
  &::after {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    box-sizing: border-box !important;
    border: 8px solid black;
    transform-origin: 0 0;
  }
  &.top {
    &::after {
      bottom: -4px;
      left: 16px;
      border-color: transparent $white $white transparent;
      transform: rotate(45deg);
      box-shadow: 3px 3px 3px 0px rgba(0, 0, 0, 0.1) !important;
    }
  }
  &.right {
    &::after {
      bottom: 50%;
      left: 0;
      border-color: transparent transparent $white $white;
      transform: rotate(45deg);
      box-shadow: -3px 3px 3px 0 rgba(0, 0, 0, 0.1) !important;
    }
  }
  &.top-right {
    &::after {
      top: 10%;
      left: 0;
      border-color: transparent transparent $white $white;
      transform: rotate(45deg);
      box-shadow: -3px 3px 3px 0 rgba(0, 0, 0, 0.1) !important;
    }
  }
}
:deep(.vc-sketch) {
  width: 250px !important;
  box-sizing: border-box;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1) !important;

  span {
    line-height: inherit;
  }
  .vc-sketch-field {
    margin: 8px 0;
    .vc-input__label {
      text-align: left;
      text-transform: uppercase;
      font-weight: bold;
      padding: 0 4px;
      line-height: unset;
    }
    .vc-input__input {
      border-radius: 4px;
      font-size: 0.8rem;
      color: $grey-darker;
      text-transform: lowercase;
      width: 100%;
      padding: 4px;
      border: solid 2px $white-ter;
      box-sizing: border-box;
      box-shadow: inset 0 0 0 1px $white-ter;
      &:hover {
        border-color: $grey-light;
      }
      &:focus {
        border-color: $primary;
      }
    }
    .vc-sketch-field--double,
    .vc-sketch-field--single {
      margin-right: 6px;
      padding-left: 0;
    }
    .vc-sketch-field--single:last-child {
      margin-right: 0;
    }
    .vc-editable-input {
      width: 100%;
    }
  }
  .vc-sketch-color-wrap {
    display: none;
  }
  .vc-sketch-sliders {
    padding: 4px;
  }
  .vc-sketch-controls {
    .vc-sketch-hue-wrap,
    .vc-sketch-alpha-wrap {
      height: 16px;
      overflow: unset;
    }
    .vc-alpha-picker,
    .vc-hue-picker {
      width: 6px;
      height: 18px;
      // border-radius: 100%;
      box-shadow: inset 0 0 0 1px #000;
      transform: translate(-2px, -2px);
    }
  }
}
</style>
