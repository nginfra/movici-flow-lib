<template>
  <div class="columns is-multiline">
    <div class="column is-two-thirds-desktop is-full-tablet">
      <label class="label">{{ t("flow.visualization.colorConfig.color") }}</label>
      <ColorInput v-model="color" colorPickerPosition="right" />
    </div>
    <div class="column is-one-third-desktop is-full-tablet">
      <slot name="legend-title"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import ColorInput from "@movici-flow-lib/components/ColorInput.vue";
import type { ColorClause, RGBAColor } from "@movici-flow-lib/types";
import { MoviciColors, hexToColorTriple } from "@movici-flow-lib/visualizers/maps/colorMaps";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  modelValue?: ColorClause;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: ColorClause): void;
}>();
const color = computed({
  get: () => props.modelValue?.static?.color ?? hexToColorTriple(MoviciColors.GREEN),
  set: updateColor,
});
function updateColor(val: RGBAColor) {
  emit("update:modelValue", {
    static: {
      color: val,
    },
  });
}
onMounted(() => updateColor(color.value));
</script>

<style scoped lang="scss"></style>
