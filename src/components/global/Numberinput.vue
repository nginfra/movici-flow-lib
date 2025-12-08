<template>
  <o-field :class="fieldClasses">
    <o-input
      class="has-text-centered"
      type="number"
      ref="input"
      v-model="computedValue"
      v-bind="$attrs"
      :max="max"
      :min="min"
      step="any"
      :size="size"
      :disabled="disabled"
      :expanded="expanded"
      :placeholder="placeholder"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
  </o-field>
</template>

<script lang="ts">
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    min?: number | string;
    max?: number | string;
    disabled?: boolean;
    variant?: string;
    size?: string;
    expanded?: boolean;
    placeholder?: number | string;
  }>(),
  {
    variant: "primary",
  }
);
const emit = defineEmits<{
  (e: "update:modelValue", val: number | null): void;
  (e: "focus", val: Event): void
  (e: "blur", val: Event): void
}>();
const input = ref<HTMLElement | null>(null);

const computedValue = computed({
  get: () => props.modelValue,
  set: (value: number | null | string) => {
    // Parses the number, so that "0" => 0, and "invalid" => null
    let newValue = Number(value) === 0 ? 0 : Number(value) || null;
    if (value === "" || value === undefined || value === null) {
      if (minNumber.value !== undefined) {
        newValue = minNumber.value;
      } else {
        newValue = null;
      }
    }
    if (newValue === null) {
      emit("update:modelValue", newValue);
    } else if (!isNaN(newValue)) {
      emit("update:modelValue", Number(newValue));
    }
  },
});

const fieldClasses = computed(() => {
  return [{ "is-expanded": props.expanded }];
});

const minNumber = computed(() => {
  return typeof props.min === "string" ? parseFloat(props.min) : props.min;
});
</script>
<style lang="scss" scoped>
:deep(.control) {
  line-height: 1.5rem;
}
</style>
