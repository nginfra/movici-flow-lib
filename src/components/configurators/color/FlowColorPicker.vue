<template>
  <div
    class="color-picker-container"
    :class="position"
    ref="colorPickerContainer"
    :style="style"
    v-if="open"
    tabindex="0"
    @blur="close"
  >
    <Sketch v-model="rgba" :presetColors="preparedColorPresets"></Sketch>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator';
import { Sketch } from 'vue-color';
import { RGBAColor } from '@movici-flow-common/types';
import { DEFAULT_UNDEFINED_COLOR_TRIPLE } from '@movici-flow-common/utils/colorUtils';

interface RGBAObject {
  rgba: { r: number; b: number; g: number; a: number };
}

@Component({
  name: 'FlowColorPicker',
  components: {
    Sketch
  }
})
export default class FlowColorPicker extends Vue {
  @Prop({ type: Array, default: () => DEFAULT_UNDEFINED_COLOR_TRIPLE }) readonly value!: RGBAColor;
  @Prop({ type: Array, default: () => [] }) readonly presets!: (RGBAColor | string)[];
  @Prop({ type: Boolean, default: false }) readonly open!: boolean;
  @Prop({ type: Number, default: 0 }) readonly translateX!: number;
  @Prop({ type: Number, default: 0 }) readonly translateY!: number;
  @Prop({ type: String, default: 'top' }) readonly position!: string;
  @Ref('colorPickerContainer') readonly colorPickerContainer!: HTMLElement;

  get preparedColorPresets(): (string | RGBAObject)[] {
    return this.presets.map(color => (Array.isArray(color) ? colorTripleToRGBA(color) : color));
  }

  // looking into positioning this in diferent ways
  get style() {
    return {
      top: {
        transform: `translateY(-96%) translateY(${this.translateY}px) translateX(${this.translateX}px)`
      },
      right: {
        transform: `translateY(-35%) translateY(${this.translateY}px) translateX(20%) translateX(${this.translateX}px)`
      },
      'top-right': {
        transform: `translateY(1%) translateY(${this.translateY}px) translateX(20%) translateX(${this.translateX}px)`
      }
    }[this.position];
  }

  get rgba(): RGBAObject {
    return colorTripleToRGBA(this.value);
  }

  set rgba({ rgba }: RGBAObject) {
    const color = [rgba.r, rgba.g, rgba.b];
    if (rgba.a < 1) {
      color[3] = Math.floor(rgba.a * 255);
    }
    this.$emit('input', color);
  }

  @Watch('open')
  autoFocus(open: boolean) {
    this.$nextTick(() => {
      if (open) this.colorPickerContainer.focus();
    });
  }

  close(event: FocusEvent) {
    const target = event.relatedTarget as HTMLElement;
    if (!this.$el.contains(target)) this.$emit('close');
  }
}

function colorTripleToRGBA(color: RGBAColor): RGBAObject {
  return {
    rgba: {
      r: color[0],
      g: color[1],
      b: color[2],
      a: color[3] !== undefined ? color[3] / 255 : 1
    }
  };
}
</script>

<style scoped lang="scss">
.color-picker-container {
  outline: none;
  position: absolute !important;
  z-index: 5;
  &::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    box-sizing: border-box !important;
    border: 8px solid black;
    transform-origin: 0 0;
  }
  &.top {
    &::after {
      bottom: -4px;
      left: 16px;
      border-color: transparent $white $white transparent;
      transform: rotate(45deg);
      box-shadow: 3px 3px 3px 0px rgba(0, 0, 0, 0.1) !important;
    }
  }
  &.right {
    &::after {
      bottom: 50%;
      left: 0;
      border-color: transparent transparent $white $white;
      transform: rotate(45deg);
      box-shadow: -3px 3px 3px 0 rgba(0, 0, 0, 0.1) !important;
    }
  }
  &.top-right {
    &::after {
      top: 10%;
      left: 0;
      border-color: transparent transparent $white $white;
      transform: rotate(45deg);
      box-shadow: -3px 3px 3px 0 rgba(0, 0, 0, 0.1) !important;
    }
  }
}
::v-deep {
  .vc-sketch {
    width: 250px !important;
    box-sizing: border-box;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1) !important;

    span {
      line-height: inherit;
    }
    .vc-sketch-field {
      margin: 8px 0;
      .vc-input__label {
        text-align: left;
        text-transform: uppercase;
        font-weight: bold;
        padding: 0 4px;
        line-height: unset;
      }
      .vc-input__input {
        border-radius: 4px;
        font-size: 0.8rem;
        color: $grey-darker;
        text-transform: lowercase;
        width: 100%;
        padding: 4px;
        border: solid 2px $white-ter;
        box-sizing: border-box;
        box-shadow: inset 0 0 0 1px $white-ter;
        &:hover {
          border-color: $grey-light;
        }
        &:focus {
          border-color: $primary;
        }
      }
      .vc-sketch-field--double,
      .vc-sketch-field--single {
        margin-right: 6px;
        padding-left: 0;
      }
      .vc-sketch-field--single:last-child {
        margin-right: 0;
      }
      .vc-editable-input {
        width: 100%;
      }
    }
    .vc-sketch-color-wrap {
      display: none;
    }
    .vc-sketch-sliders {
      padding: 4px;
    }
    .vc-sketch-controls {
      .vc-sketch-hue-wrap,
      .vc-sketch-alpha-wrap {
        height: 16px;
        overflow: unset;
      }
      .vc-alpha-picker,
      .vc-hue-picker {
        width: 6px;
        height: 18px;
        // border-radius: 100%;
        box-shadow: inset 0 0 0 1px #000;
        transform: translate(-2px, -2px);
      }
    }
  }
}
</style>
