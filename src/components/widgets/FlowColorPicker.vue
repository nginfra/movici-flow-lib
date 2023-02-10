<template>
  <div
    class="color-picker-container"
    :class="position"
    ref="colorPickerContainer"
    :style="style"
    v-if="isOpen"
    tabindex="0"
    @blur="$emit('close')"
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

  isOpen = false;
  coolDown = false;

  get preparedColorPresets(): (string | RGBAObject)[] {
    return this.presets.map(color => (Array.isArray(color) ? colorTripleToRGBA(color) : color));
  }

  // looking into positioning this in diferent ways
  get style() {
    let transform = {
      top: 'translateY(-100%) translateY(-10px)',
      right: 'translateY(-50%)',
      'top-right': 'translateY(-48px) translateX(12px)'
    }[this.position];

    return {
      transform: transform + `translateY(${this.translateY}px) translateX(${this.translateX}px)`
    };
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

  @Watch('open', { immediate: true })
  handleOpen(open: boolean) {
    /* We need to handle the blur event correctly. This means that we first have to focus the
    colorPickerContainer when it appears, so that clicking outside it's area, actually triggers
    the blur event. Because of Vue reasons, this needs to be done in a $nextTick callback.
    Now that we're properly detecting the blur event, we need to deal with a false positive, namely
    when we use an (outside this component) toggle button to close it. Clicking the toggle button
    first fires the blur event (thereby closing this component) and then it is activated again in
    the toggle action, which is undesirable. We therefore introduce a cooldown. If the component
    has been closed, it cannot be opened again within x(=100) ms.
    */
    const COOLDOWN_MS = 100;
    if (open && this.coolDown) {
      this.$emit('close');
    }

    this.isOpen = open;

    if (open) {
      this.$nextTick(() => {
        this.colorPickerContainer?.focus();
      });
    } else if (!this.coolDown) {
      this.coolDown = true;
      setTimeout(() => {
        this.coolDown = false;
      }, COOLDOWN_MS);
    }
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
