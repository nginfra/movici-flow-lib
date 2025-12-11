<template>
  <div class="is-flex">
    <div class="is-flex-shrink-1 mr-4 colors">
      <label class="label">{{ t("flow.visualization.colorConfig.advanced.advColours") }}</label>
      <o-field class="is-flex" v-for="(color, index) in colors" :key="index">
        <ColorInput
          :modelValue="color"
          @update:modelValue="updateColor(index, $event)"
          colorPickerPosition="top"
        />
        <span class="ml-1 is-size-7">
          {{ getColorTitle(index) }}
        </span>
      </o-field>
    </div>
    <div class="is-flex-grow-1 mapped-values">
      <label class="label">{{ t("flow.visualization.byValueConfig.value") }}</label>
      <o-field class="is-align-items-center" v-for="(label, index) in labels" :key="index">
        <o-input :modelValue="label" size="small" disabled></o-input>
      </o-field>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdvColorMapping, RGBAColor } from "@movici-flow-lib/types";
import { computed } from "vue";
import ColorInput from "../ColorInput.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  modelValue: AdvColorMapping;
}>();
const emit = defineEmits<{
  (e: "setColor", val: { id: number; newValue: RGBAColor }): void;
}>();

const labels = computed(() => props.modelValue.map((val) => String(val[0])));
const colors = computed(() => props.modelValue.map((val) => val[1]));

function updateColor(id: number, newValue: RGBAColor) {
  emit("setColor", { id, newValue });
}

function getColorTitle(i: number) {
  return i === 0 ? "Special" : "Undefined";
}
</script>

<style lang="scss"></style>
