<template>
  <div>
    <span class="b-tooltip is-white is-bottom is-medium" :class="color">
      <div class="tooltip-content" v-show="visible" ref="popupRef" :style="style">
        <slot name="tooltip-content">
          <span class="is-size-7">
            {{ text }}
          </span>
        </slot>
      </div>
      <div
        class="tooltip-trigger"
        ref="anchorRef"
        @mouseover="toggle(true)"
        @mouseleave="toggle(false)"
      >
        <b-icon v-if="!this.$slots.default" :icon="icon"> </b-icon>
        <slot></slot>
      </div>
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref } from 'vue-property-decorator';
import FixedPosition from '@movici-flow-common/mixins/FixedPosition';

@Component({ name: 'MovTooltipInfo' })
export default class MovTooltipInfo extends Mixins(FixedPosition) {
  @Prop({ type: String, default: '' }) readonly text!: string;
  @Prop({ type: String, default: 'info' }) readonly icon!: string;
  @Prop({ type: String, default: 'is-bottom' }) readonly position!: string;
  @Prop({ type: String, default: 'is-black' }) readonly color!: string;
  @Prop({ type: String, default: 'is-small' }) readonly size!: string;
  @Prop({ type: Boolean, default: false }) readonly active!: boolean;
  @Prop({ type: Number, default: 0 }) readonly delay!: number;
  @Ref('anchorRef') declare readonly anchorRef: HTMLElement;
  @Ref('popupRef') declare readonly popupRef: HTMLElement;
  adjust = {
    top: 30,
    left: -80
  };
}
</script>

<style scoped lang="scss">
.icon {
  font-size: 0.5rem;
  border-radius: 100%;
  height: 1rem;
  width: 1rem;
  line-height: 0.5rem;
}
</style>
