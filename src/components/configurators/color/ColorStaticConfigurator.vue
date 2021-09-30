<template>
  <div class="columns is-multiline">
    <div class="column is-two-thirds-desktop is-full-tablet color">
      <FlowColorPicker
        :value="color"
        @input="updateColor($event)"
        :presets="colorPickerPresets"
        :open="showColorPicker"
        @close="showColorPicker = false"
      />
      <label class="label">{{ $t('flow.visualization.colorConfig.color') }}</label>
      <b-field v-if="color" class="color-item">
        <span></span>
        <span
          class="color-wrap"
          :class="{ active: showColorPicker }"
          :style="{ 'background-color': hexColor }"
          @click="showColorPicker = !showColorPicker"
          ref="anchorRef"
        ></span>
      </b-field>
    </div>
    <div class="column is-one-third-desktop is-full-tablet">
      <slot name="legend-title"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import {
  colorTripleToHex,
  hexToColorTriple,
  MoviciColors
} from '@/flow/src/visualizers/maps/colorMaps';
import { ColorClause, RGBAColor, StaticColorClause } from '@/flow/src/types';
import FlowColorPicker from '@/flow/src/components/configurators/color/FlowColorPicker.vue';

@Component({
  components: {
    FlowColorPicker
  }
})
export default class ColorStaticConfigurator extends Vue {
  @Prop() value!: StaticColorClause | null;
  color: RGBAColor = hexToColorTriple(MoviciColors.GREEN);
  colorPickerPresets = Object.values(MoviciColors);
  showColorPicker = false;

  get hexColor() {
    return colorTripleToHex(this.color);
  }

  updateColor(newValue: RGBAColor) {
    this.$emit('input', {
      static: {
        color: newValue
      }
    } as Partial<ColorClause>);
  }

  @Watch('value', { immediate: true })
  setupColor() {
    if (this.value?.color) {
      this.color = this.value.color;
    } else {
      this.updateColor(this.color);
    }
  }
}
</script>

<style scoped lang="scss">
.color {
  position: relative;
  .color-wrap {
    display: inline-block;
  }
}
</style>
