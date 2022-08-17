<template>
  <div
    class="popup"
    ref="container"
    tabindex="0"
    :class="computedClass"
    :style="containerStyle"
    @click="$emit('click')"
  >
    <div class="popup-tip" v-if="!!value && tip"></div>
    <div class="data-viewer box p-0" ref="content" v-show="!!value">
      <slot/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { CameraOptions } from '@movici-flow-common/types';
import inRange from 'lodash/inRange';
import {
  ANCHOR_TYPE,
  getContainerStyle,
  getDynamicPosition,
  getNearestPointOnLine,
  getClickPosition,
  getPointCenter
} from '@movici-flow-common/utils/canvasPositioning';
import { PickInfo } from '@deck.gl/core/lib/deck';

const DISPLAY_NONE = { display: 'none' };

@Component({ name: 'DynamicDataView' })
export default class DynamicDataView extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: PickInfo<unknown> | null;
  @Prop({ type: Object, default: null }) readonly map!: mapboxgl.Map | null;
  @Prop({ type: Object }) readonly viewState?: CameraOptions;
  @Prop({ type: Boolean, default: false }) readonly tip?: boolean;
  @Prop({ type: String, default: 'bottom' }) readonly startAnchorType!: ANCHOR_TYPE;
  @Prop({ type: Object }) readonly borderPadding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  anchorType: ANCHOR_TYPE | null = null;
  containerStyle: Partial<CSSStyleDeclaration> = {};

  get computedClass() {
    return `popup-anchor-${this.anchorType}`;
  }

  getCoordinatesFunction(layerType = '') {
    switch (layerType) {
      case 'ScatterplotLayer':
        return getPointCenter;
      case 'PathLayer':
        return getNearestPointOnLine;
      case 'ShapeIconLayer':
      case 'PolygonLayer':
      default:
        return getClickPosition;
    }
  }

  recalculatePosition(
    x: number,
    y: number,
    contentSize: { width: number; height: number },
    canvasSize: { width: number; height: number },
    padding = 5
  ) {
    // makes sure element is inside the map area
    if (inRange(x, 0, canvasSize.width) && inRange(y, 0, canvasSize.height)) {
      this.anchorType = getDynamicPosition({
        x,
        y,
        padding,
        anchorType: this.startAnchorType,
        width: canvasSize.width,
        height: canvasSize.height,
        selfWidth: contentSize.width,
        selfHeight: contentSize.height,
        borderPadding: this.borderPadding
      });

      this.containerStyle = getContainerStyle({
        x,
        y,
        padding,
        width: canvasSize.width,
        height: canvasSize.height,
        selfWidth: contentSize.width,
        selfHeight: contentSize.height,
        anchorType: this.anchorType
      });
    } else {
      this.containerStyle = DISPLAY_NONE;
    }
  }

  @Watch('viewState')
  @Watch('borderPadding')
  @Watch('value', { immediate: true })
  recalculate() {
    if (this.map && this.value?.layer) {
      const coords = this.getCoordinatesFunction(this.value.layer.constructor.name)(this.value),
        contentSize = {
          width: (this.$refs.content as HTMLElement)?.clientWidth ?? 220,
          height: (this.$refs.content as HTMLElement)?.clientHeight ?? 130
        },
        canvasSize = {
          width: this.map.getCanvas().clientWidth ?? 1920,
          height: this.map.getCanvas().clientHeight ?? 969
        },
        { x, y } = this.map.project(coords as [number, number]);

      this.recalculatePosition(x, y, contentSize, canvasSize);
    }
  }
}
</script>

<style scoped lang="scss">
.popup {
  z-index: 2;
  &.focused {
    z-index: 3;
  }
  .data-viewer {
    padding: 0.75rem;
    min-width: 12rem;
    color: $grey-dark !important;
    &.focused {
      color: $black !important;
    }
  }
}
</style>
