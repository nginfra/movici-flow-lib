<template>
  <div class="is-flex is-flex-direction-row is-flex-grow-1">
    <b-field class="is-flex-grow-1" :label="$t('flow.visualization.colorConfig.type')">
      <b-select :value="selectedGroupName" @input="selectGroupName" size="is-small" expanded>
        <option v-for="(name, index) in groupNames" :key="index" :value="name">
          {{ name }}
        </option>
      </b-select>
    </b-field>
    <ColorPaletteDropdown
      v-if="colorPalettes"
      v-model="selectedPaletteIdx"
      :colorPalettes="colorPalettes"
      :nSteps="nSteps"
      :filter="colorPaletteFilter"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import ColorPaletteDropdown from './ColorPaletteDropdown.vue';
import ColorPalette, { DEFAULT_COLOR_PALETTES } from './colorPalettes';

@Component({ name: 'ColorPaletteSelector', components: { ColorPaletteDropdown } })
export default class ColorPaletteSelector extends Vue {
  @Prop({ type: Object, default: null }) value!: ColorPalette | null;
  @Prop({ type: Number, default: 4 }) nSteps!: number;

  selectedGroupName = 'Sequential';
  selectedPaletteIdx: number | null = 0;

  get groupNames() {
    return Object.keys(DEFAULT_COLOR_PALETTES);
  }

  get colorPalettes() {
    return DEFAULT_COLOR_PALETTES[this.selectedGroupName] ?? [];
  }

  get currentColorPalette() {
    return this.selectedPaletteIdx != null
      ? this.colorPalettes[this.selectedPaletteIdx] ?? null
      : null;
  }
  get colorPaletteFilter() {
    const nSteps = this.nSteps;
    return (palette: ColorPalette) => palette.supportsSize(nSteps);
  }

  selectGroupName(name: string) {
    this.selectedGroupName = name;
    this.selectedPaletteIdx = null;
  }

  @Watch('value', { immediate: true })
  updateSelectors(palette: ColorPalette | null) {
    if (!palette) {
      this.selectedGroupName = 'Sequential';
      this.selectedPaletteIdx = null;
      return;
    }
    [this.selectedGroupName, this.selectedPaletteIdx] = this.lookupPalette(palette);
  }
  lookupPalette(colorPalette: ColorPalette): [string, number | null] {
    for (let [groupName, palettes] of Object.entries(DEFAULT_COLOR_PALETTES)) {
      for (let [idx, palette] of palettes.entries()) {
        if (palette.name === colorPalette.name) {
          return [groupName, idx];
        }
      }
    }

    return ['Sequential', null];
  }

  @Watch('currentColorPalette')
  emitCurrentPalette() {
    this.$emit('input', this.currentColorPalette);
  }

  mounted() {
    this.emitCurrentPalette();
  }
}
</script>
<style lang="scss" scoped></style>
