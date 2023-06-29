<template>
  <div>
    <div v-if="modelValue">
      <span class="is-flex">
        <label class="label is-flex-grow-1">{{ $t("flow.visualization.legendLabel") }}</label>
        <MovKebabMenu
          :modelValue="actions"
          @resetLegends="resetLegends"
          @clearLegends="clearLegends"
        />
      </span>
      <o-field v-for="[index, item] in labelEntries" :key="index">
        <o-input :modelValue="item" @update:modelValue="updateItem(index, $event)" size="small" />
      </o-field>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ActionItem, LegendOptions } from "@movici-flow-lib/types";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    modelValue?: LegendOptions;
    placeholders?: string[];
    reversed?: boolean;
  }>(),
  {
    placeholders: () => [],
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: LegendOptions): void;
}>();

const actions: ActionItem[] = [
  {
    label: t("flow.visualization.legendsConfig.reset"),
    icon: "undo",
    iconPack: "far",
    event: "resetLegends",
  },
  {
    label: t("actions.clear"),
    icon: "trash",
    iconPack: "far",
    event: "clearLegends",
    variant: "danger",
  },
];

const labels = computed(() => {
  return props.modelValue?.labels ?? [];
});

const labelEntries = computed(() => {
  const entries = Array.from(labels.value.entries());
  return props.reversed ? entries.reverse() : entries;
});

const nItems = computed(() => {
  return props.placeholders.length;
});
function resetLegends() {
  emitLegend(props.placeholders);
}

function clearLegends() {
  emitLegend(new Array(props.placeholders.length).fill(""));
}

function updateItem(idx: number, val: string) {
  emitLegend(
    labels.value.map((label, arrayIdx) => {
      return arrayIdx === idx ? val : label;
    })
  );
}

function emitLegend(labels: string[]) {
  emit("update:modelValue", { labels } as LegendOptions);
}
watch(
  nItems,
  (val) => {
    emitLegend(
      Array(val)
        .fill("")
        .map((val, idx) => labels.value?.[idx] ?? val)
    );
  },
  { immediate: true }
);
</script>

<style scoped lang="scss"></style>
