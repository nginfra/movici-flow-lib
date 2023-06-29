<template>
  <div class="columns is-multiline">
    <div class="column is-two-thirds-desktop is-full-tablet">
      <IconSelector
        :modelValue="currentIcon"
        @update:modelValue="updateIcon($event)"
        :iconOptions="iconOptions"
        :buttons="buttons"
        :label="label"
        pack="fas"
        allowEmpty
      />
    </div>
    <div class="column is-one-third-desktop is-full-tablet">
      <slot name="legend-title"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IconClause } from "@movici-flow-lib/types";
import type { IconMapping } from "@movici-flow-lib/visualizers/layers/ShapeIconLayer";
import { computed } from "vue";
import IconSelector from "./IconSelector.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: IconClause;
    buttons?: boolean;
    iconOptions: IconMapping;
    label?: string;
  }>(),
  {
    iconOptions: () => ({}),
    label: "",
  }
);
const emit = defineEmits<{
  (e: "update:modelValue", val: IconClause): void;
}>();

const currentIcon = computed(() => {
  return props.modelValue?.static?.icon;
});

function updateIcon(icon: string | null) {
  emit("update:modelValue", !icon ? {} : { static: { icon } });
}
</script>

<style scoped lang="scss"></style>
