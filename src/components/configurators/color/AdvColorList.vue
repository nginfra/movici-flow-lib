<template>
  <div class="is-flex">
    <div class="is-flex-shrink-1 mr-4 colors">
      <label class="label">{{ $t('flow.visualization.colorConfig.advanced.advColours') }}</label>
      <o-field class="is-flex" v-for="(color, index) in colors" :key="index">
        <ColorInput :value="color" @input="updateColor(index, $event)" colorPickerPosition="top" />
        <span class="ml-1 is-size-7">
          {{ getColorTitle(index) }}
        </span>
      </o-field>
    </div>
    <div class="is-flex-grow-1 mapped-values">
      <label class="label">{{ $t('flow.visualization.byValueConfig.value') }}</label>
      <o-field class="is-align-items-center" v-for="(label, index) in labels" :key="index">
        <o-input :value="label" size="small" disabled></o-input>
      </o-field>
    </div>
  </div>
</template>

<script lang="ts">
import { RGBAColor } from '@deck.gl/core';
import { AdvColorMapping } from '@movici-flow-common/types';
import { Component, Vue, Prop } from 'vue-property-decorator';
import ColorInput from '../../widgets/ColorInput.vue';
@Component({
  name: 'AdvColorList',
  components: {
    ColorInput
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

  get labels(): string[] {
    return this.value.map(val => String(val[0]));
  }

  updateColor(id: number, newValue: RGBAColor) {
    this.$emit('input', { id, newValue });
  }

  getColorTitle(i: number) {
    return i === 0 ? 'Special' : 'Undefined';
  }
}
</script>

<style lang="scss"></style>
