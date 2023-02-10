<template>
  <div class="columns is-multiline">
    <div class="column is-two-thirds-desktop is-full-tablet">
      <label class="label">{{ $t('flow.visualization.colorConfig.color') }}</label>
      <ColorInput :value="color" @input="updateColor" colorPickerPosition="right" />
    </div>
    <div class="column is-one-third-desktop is-full-tablet">
      <slot name="legend-title"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import {
  colorTripleToHex,
  hexToColorTriple,
  MoviciColors
} from '@movici-flow-common/visualizers/maps/colorMaps';
import { ColorClause, RGBAColor } from '@movici-flow-common/types';
import ColorInput from '@movici-flow-common/components/widgets/ColorInput.vue';

@Component({
  name: 'ColorStaticConfigurator',
  components: {
    ColorInput
  }
})
export default class ColorStaticConfigurator extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: ColorClause | null;
  colorPickerPresets = Object.values(MoviciColors);
  showColorPicker = false;

  get color() {
    return this.value?.static?.color ?? hexToColorTriple(MoviciColors.GREEN);
  }

  get hexColor() {
    return colorTripleToHex(this.color);
  }

  updateColor(color: RGBAColor) {
    this.$emit('input', {
      static: {
        color
      }
    } as ColorClause);
  }
  mounted() {
    if (!this.value?.static?.color) {
      this.updateColor(this.color);
    }
  }
}
</script>

<style scoped lang="scss"></style>
