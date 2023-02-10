<template>
  <div class="color-input">
    <span
      class="color-box"
      :class="{ active: showColorPicker }"
      :style="{ 'background-color': hexColor }"
      @click="toggleColorPicker"
    ></span>
    <span v-if="caret" class="caret" />
    <FlowColorPicker
      :value="value"
      @input="$emit('input', $event)"
      :presets="colorPickerPresets"
      :open="showColorPicker"
      @close="closeColorPicker"
      :translateX="translate[0]"
      :translateY="translate[1]"
      :position="colorPickerPosition"
    />
  </div>
</template>

<script lang="ts">
import { RGBAColor } from '@movici-flow-common/types';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { colorTripleToHex, MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';
import FlowColorPicker from './FlowColorPicker.vue';

@Component({
  name: 'ColorInput',
  components: {
    FlowColorPicker
  }
})
export default class ColorInput extends Vue {
  @Prop({ type: Array }) readonly value?: RGBAColor;
  @Prop({ type: Boolean, default: false }) readonly caret!: boolean;
  @Prop({ type: String, default: 'right' }) readonly colorPickerPosition!: string;
  showColorPicker = false;
  colorPickerPresets = Object.values(MoviciColors);
  active = false;

  get hexColor() {
    return this.value ? colorTripleToHex(this.value) : MoviciColors.VERY_DARK_GREY;
  }

  get translate() {
    switch (this.colorPickerPosition) {
      case 'top':
        return [-1, -30];
      case 'right':
        return [this.caret ? 64 : 44, -10];
      case 'top-right':
        return [32, -12];
      default:
        return [0, 0];
    }
  }

  closeColorPicker() {
    this.showColorPicker = false;
  }

  toggleColorPicker() {
    this.showColorPicker = !this.showColorPicker;
  }
}
</script>

<style lang="scss" scoped>
.color-input {
  .color-box {
    @include border-radius;
    cursor: pointer;
    border: 2px solid $white-ter;
    min-width: 30px;
    height: 30px;
    // line-height: unset;
    display: inline-block;
    margin-bottom: -9px;
    &.active {
      border-color: $primary;
    }
  }
  .caret {
    position: absolute;
    width: 0;
    height: 0;
    top: 9px;
    right: -8px;
    border: 4px solid $black;
    border-color: $grey-lightest $grey-lightest transparent transparent;
    transform-origin: 0 0;
    transform: rotate(45deg);
  }
  &:hover {
    .caret {
      border-color: $grey-light $grey-light transparent transparent;
    }
    .color-box {
      border-color: $grey-light;
    }
  }
}
</style>
