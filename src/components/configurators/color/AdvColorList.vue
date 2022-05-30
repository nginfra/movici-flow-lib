<template>
  <div class="is-flex">
    <div class="is-flex-shrink-1 mr-4 colors">
      <label class="label">{{ $t('flow.visualization.colorConfig.advanced.advColours') }}</label>
      <div class="is-relative" v-if="value && selectedIndex >= 0">
        <FlowColorPicker
          :value="colors[selectedIndex]"
          @input="updateColor(selectedIndex, $event)"
          :presets="presets"
          :open="showColorPicker"
          @close="showColorPicker = false"
          :translateY="translateY"
          position="top"
        />
      </div>
      <b-field class="is-flex color-item" v-for="(color, index) in hexColors" :key="index">
        <span
          class="color-wrap"
          :class="{ active: selectedIndex === index }"
          :style="{ 'background-color': color }"
          @click="openColorPicker(index)"
        ></span>
        <span class="ml-1 is-size-7">
          {{ getColorTitle(index) }}
        </span>
      </b-field>
    </div>
    <div class="is-flex-grow-1 mapped-values">
      <label class="label">{{ $t('flow.visualization.colorConfig.value') }}</label>
      <b-field class="is-align-items-center" v-for="(label, index) in labels" :key="index">
        <b-input :value="label" size="is-small" disabled></b-input>
      </b-field>
    </div>
  </div>
</template>

<script lang="ts">
import { RGBAColor } from '@deck.gl/core';
import { AdvColorMapping } from '@movici-flow-common/types';
import { colorTripleToHex } from '@movici-flow-common/visualizers/maps/colorMaps';
import { Component, Vue, Prop } from 'vue-property-decorator';
import FlowColorPicker from './FlowColorPicker.vue';

@Component({
  name: 'AdvColorList',
  components: {
    FlowColorPicker
  }
})
export default class AdvColorList extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly value!: AdvColorMapping;
  @Prop({ type: Array, default: () => [] }) readonly presets!: (RGBAColor | string)[];
  selectedIndex = -1;
  showColorPicker = false;

  get colors(): RGBAColor[] {
    return this.value.map(val => val[1]);
  }

  get hexColors(): string[] {
    return this.value.map(c => colorTripleToHex(c[1]));
  }

  get labels(): string[] {
    return this.value.map(val => String(val[0]));
  }

  get translateY() {
    return this.selectedIndex * 42 - 24;
  }

  updateColor(id: number, newValue: RGBAColor) {
    this.$emit('input', { id, newValue });
  }

  getColorTitle(i: number) {
    return i === 0 ? 'Special' : 'Undefined';
  }

  colorTripleToHex = colorTripleToHex;

  openColorPicker(index: number) {
    if (this.showColorPicker && this.selectedIndex === index) {
      this.showColorPicker = false;
      this.selectedIndex = -1;
    } else {
      this.selectedIndex = index;
      this.showColorPicker = true;
    }
  }
}
</script>

<style lang="scss"></style>
