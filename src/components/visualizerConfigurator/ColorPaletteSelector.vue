<template>
  <div class="is-flex is-flex-direction-row is-flex-grow-1">
    <o-field class="is-flex-grow-1" :label="t('flow.visualization.colorConfig.type')">
      <o-select
        :modelValue="selectedGroupName"
        @update:modelValue="selectGroupName"
        size="small"
        expanded
      >
        <option v-for="(name, index) in groupNames" :key="index" :value="name">
          {{ name }}
        </option>
      </o-select>
    </o-field>
    <ColorPaletteDropdown
      v-if="colorPalettes"
      v-model="selectedPaletteIdx"
      :colorPalettes="colorPalettes"
      :nSteps="nSteps"
      :filter="colorPaletteFilter"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ColorPaletteDropdown from "./ColorPaletteDropdown.vue";
import ColorPalette, { DEFAULT_COLOR_PALETTES } from "./colorPalettes";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  modelValue?: ColorPalette | null;
  nSteps: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: ColorPalette): void;
}>();
const selectedGroupName = ref("Sequential");
const selectedPaletteIdx = ref<number | null>(0);

const groupNames = computed(() => {
  return Object.keys(DEFAULT_COLOR_PALETTES);
});

const colorPalettes = computed(() => {
  return DEFAULT_COLOR_PALETTES[selectedGroupName.value] ?? [];
});

const currentColorPalette = computed(() => {
  return selectedPaletteIdx.value != null
    ? colorPalettes.value[selectedPaletteIdx.value] ?? null
    : null;
});
const colorPaletteFilter = computed(() => {
  const nSteps = props.nSteps;
  return (palette: ColorPalette) => palette.supportsSize(nSteps);
});

function selectGroupName(name: string) {
  selectedGroupName.value = name;
  selectedPaletteIdx.value = null;
}

watch(
  () => props.modelValue,
  (palette) => {
    if (!palette) {
      selectedGroupName.value = "Sequential";
      selectedPaletteIdx.value = null;
      return;
    }
    [selectedGroupName.value, selectedPaletteIdx.value] = lookupPalette(palette);
  }
);

function lookupPalette(colorPalette: ColorPalette): [string, number | null] {
  for (const [groupName, palettes] of Object.entries(DEFAULT_COLOR_PALETTES)) {
    for (const [idx, palette] of palettes.entries()) {
      if (palette.name === colorPalette.name) {
        return [groupName, idx];
      }
    }
  }

  return ["Sequential", null];
}

watch(currentColorPalette, (palette) => {
  if (palette) {
    emit("update:modelValue", palette);
  }
});
</script>
<style lang="scss" scoped></style>
