<template>
  <div
    class="color-picker-container"
    ref="colorPickerContainer"
    :style="style"
    v-if="open"
    tabindex="0"
    @blur="close"
  >
    <Sketch v-model="hexValue" :presetColors="hexColors"></Sketch>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator';
import { colorTripleToHex, hexToColorTriple } from '@/visualizers/maps/colorMaps';
import Sketch from 'vue-color/src/components/Sketch.vue';
import { RGBAColor } from '@/types';

@Component({
  name: 'FlowColorPicker',
  components: {
    Sketch
  }
})
export default class FlowColorPicker extends Vue {
  @Prop({
    type: Array,
    default: () => [0, 0, 0]
  })
  readonly value!: RGBAColor;
  @Prop({ type: Array, default: () => [] }) readonly presets!: (RGBAColor | string)[];
  @Prop({ type: Boolean, default: false }) readonly open!: boolean;
  @Prop({ type: Number, default: 0 }) readonly translateY!: number;
  @Ref('colorPickerContainer') readonly colorPickerContainer!: HTMLElement;

  get hexColors(): string[] {
    return this.presets.map(color => (Array.isArray(color) ? colorTripleToHex(color) : color));
  }

  // looking into positioning this in diferent ways
  get style() {
    return {
      top: {
        transform: 'translateY(-100%) translateY(' + this.translateY + 'px)'
      },
      right: {
        transform: 'translateY(-50%) translateY(' + this.translateY + 'px) translateX(20%)'
      }
    }['right'];
  }

  get hexValue(): { hex: string; a: number } {
    return {
      hex: colorTripleToHex(this.value.slice(0, 3) as [number, number, number]),
      a: this.value[3] !== undefined ? this.value[3] / 255 : 1
    };
  }

  set hexValue(val: { hex: string; a: number }) {
    const color = hexToColorTriple(val.hex);
    if (val.a < 1) {
      color[3] = Math.floor(val.a * 255);
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
</script>

<style scoped lang="scss">
.color-picker-container {
  outline: none;
  position: absolute !important;
  z-index: 10;
  top: 33px;
  padding-top: 10px;
}
::v-deep {
  .vc-sketch {
    width: 250px !important;
    box-sizing: border-box;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1) !important;
    &::after {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      top: 50%;
      left: 0;
      box-sizing: border-box !important;
      border: 8px solid black;
      border-color: transparent transparent $white $white;
      transform-origin: 0 0;
      transform: rotate(45deg);
      box-shadow: -3px 3px 3px 0 rgba(0, 0, 0, 0.1) !important;
    }
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
