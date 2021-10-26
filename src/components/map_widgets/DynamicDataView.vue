<template>
  <div
    class="popup"
    ref="containerRef"
    :class="`popup-anchor-${anchorDirection}`"
    :style="containerStyle"
  >
    <div class="popup-tip" v-show="!!value"></div>
    <div class="data-viewer box" ref="contentRef" v-show="!!value">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
const ANCHOR_POSITION = {
  top: { x: 0.5, y: 0 },
  'top-left': { x: 0, y: 0 },
  'top-right': { x: 1, y: 0 },
  bottom: { x: 0.5, y: 1 },
  'bottom-left': { x: 0, y: 1 },
  'bottom-right': { x: 1, y: 1 },
  left: { x: 0, y: 0.5 },
  right: { x: 1, y: 0.5 }
};

type ANCHOR_POSITIONS = keyof typeof ANCHOR_POSITION;

interface DynamicPositionOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
  selfWidth: number;
  selfHeight: number;
  anchorDirection: ANCHOR_POSITIONS;
  borderPadding?: { top: number; right: number; bottom: number; left: number };
}

import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { CameraOptions, PopupContent } from '@/flow/types';

@Component({
  name: 'DynamicDataView'
})
export default class DynamicDataView extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: PopupContent | null;
  @Prop({ type: Object, default: null }) readonly map!: mapboxgl.Map | null;
  @Prop([Object]) readonly viewState!: CameraOptions;
  @Prop([Object]) readonly borderPadding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  anchorDirection: ANCHOR_POSITIONS = 'top';
  containerStyle: Partial<CSSStyleDeclaration> = {};

  /**
   * Function adapted from `react-map-gl` https://github.com/visgl/react-map-gl/blob/master/src/utils/dynamic-position.js
   * Calculate the dynamic position for a popup to fit in a container.
   * @param {Object} opts
   * @param {Number} opts.x - x position of the anchor on screen
   * @param {Number} opts.y - y position of the anchor on screen
   * @param {Number} opts.width - width of the container
   * @param {Number} opts.height - height of the container
   * @param {Number} opts.padding - extra space from the edge in pixels
   * @param {Number} opts.selfWidth - width of the popup
   * @param {Number} opts.selfHeight - height of the popup
   * @param {String} opts.anchor - type of the anchor, one of 'top', 'bottom','left', 'right', 'top-left', 'top-right', 'bottom-left' , and  'bottom-right'
   * @returns {String} position - one of 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left' , and  'bottom-right'
   */

  // eslint-disable-next-line complexity,max-statements
  getDynamicPosition({
    x,
    y,
    width,
    height,
    selfWidth,
    selfHeight,
    anchorDirection,
    padding,
    borderPadding
  }: DynamicPositionOpts): ANCHOR_POSITIONS {
    const paddingTop = padding + (borderPadding?.top ?? 0);
    const paddingBottom = padding + (borderPadding?.bottom ?? 0);
    const paddingLeft = padding + (borderPadding?.left ?? 0);
    const paddingRight = padding + (borderPadding?.right ?? 0);

    let { x: anchorX, y: anchorY } = ANCHOR_POSITION[anchorDirection],
      top = y - anchorY * selfHeight,
      bottom = top + selfHeight,
      cutoffY = Math.max(0, paddingTop - top) + Math.max(0, bottom - height + paddingBottom);

    if (cutoffY > 0) {
      let bestAnchorY = anchorY,
        minCutoff = cutoffY;

      for (anchorY = 0; anchorY <= 1; anchorY += 0.5) {
        top = y - anchorY * selfHeight;
        bottom = top + selfHeight;
        cutoffY = Math.max(0, paddingTop - top) + Math.max(0, bottom - height + paddingBottom);

        if (cutoffY < minCutoff) {
          minCutoff = cutoffY;
          bestAnchorY = anchorY;
        }
      }
      anchorY = bestAnchorY;
    }

    // If needed, adjust anchorX at 0.5 step between [0, 1]
    let xStep = 0.5;
    if (anchorY === 0.5) {
      // If y is centered, then x cannot also be centered
      anchorX = Math.floor(anchorX);
      xStep = 1;
    }

    // anchorX: left - 0, center - 0.5, right - 1
    // left offset must consider if view is collapsed or not
    let left = x - anchorX * selfWidth,
      right = left + selfWidth,
      cutoffX = Math.max(0, paddingLeft - left) + Math.max(0, right - width + paddingRight);

    if (cutoffX > 0) {
      // Needs horizontal adjustment
      let bestAnchorX = anchorX,
        minCutoff = cutoffX;

      // Test anchorX at xStep between [0, 1]
      for (anchorX = 0; anchorX <= 1; anchorX += xStep) {
        left = x - anchorX * selfWidth;
        right = left + selfWidth;
        cutoffX = Math.max(0, paddingLeft - left) + Math.max(0, right - width + paddingRight);
        if (cutoffX < minCutoff) {
          minCutoff = cutoffX;
          bestAnchorX = anchorX;
        }
      }
      anchorX = bestAnchorX;
    }
    // Find the name of the new anchor position
    return (
      (Object.keys(ANCHOR_POSITION) as ANCHOR_POSITIONS[]).find(
        (anchorDirection: ANCHOR_POSITIONS) => {
          const anchorPosition: { x: number; y: number } = ANCHOR_POSITION[anchorDirection];
          return anchorPosition.x === anchorX && anchorPosition.y === anchorY;
        }
      ) || anchorDirection
    );
  }

  // function adapted from `react-map-gl` https://github.com/visgl/react-map-gl/blob/master/src/components/popup.js
  getContainerStyle({ width, height, x, y, padding }: Partial<DynamicPositionOpts>) {
    const z = 0,
      directionMap = {
        left: this.anchorDirection.includes('left'),
        right: this.anchorDirection.includes('right'),
        top: this.anchorDirection.includes('top'),
        bottom: this.anchorDirection.includes('bottom')
      };

    let style: Partial<CSSStyleDeclaration> = {};

    if (this.map && padding && width && height && x && y) {
      const pixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
        crispPixel = (size: number) => Math.round(size * pixelRatio) / pixelRatio,
        crispPercentage = (origSize: number, percentage: number) => {
          return (crispPixel((percentage / 100) * origSize) / origSize) * 100;
        },
        xPadding = directionMap.left ? -padding : directionMap.right ? padding : 0,
        yPadding = directionMap.top ? -padding : directionMap.bottom ? padding : 0,
        sortByDepth = false,
        anchorPosition = ANCHOR_POSITION[this.anchorDirection],
        left = x - xPadding,
        top = y - yPadding,
        containerWidth = this.map.getCanvasContainer().clientWidth,
        containerHeight = this.map.getCanvasContainer().clientHeight,
        xPercentage = crispPercentage(width, -anchorPosition.x * 100),
        yPercentage = crispPercentage(height, -anchorPosition.y * 100);

      style = {
        position: 'absolute',
        transform: `
          translate(${xPercentage}%, ${yPercentage}%)
          translate(${crispPixel(left)}px, ${crispPixel(top)}px)
        `,
        display: String(),
        zIndex: String()
      };

      if (!sortByDepth) {
        return style;
      }

      if (z > 1 || z < -1 || x < 0 || x > containerWidth || y < 0 || y > containerHeight) {
        // clipped
        style.display = 'none';
      } else {
        // use z-index to rearrange components
        style.zIndex = String(Math.floor(((1 - z) / 2) * 100000));
      }
    }

    return style;
  }

  recalculatePosition(
    containerSize: { width: number; height: number },
    contentSize: { width: number; height: number }
  ) {
    if (this.map && this.value) {
      const mapContainer = this.map.getCanvasContainer(),
        { coordinate } = this.value?.pickInfo,
        { x, y } = this.map.project(coordinate as [number, number]);

      this.anchorDirection = this.getDynamicPosition({
        x,
        y,
        padding: 50,
        anchorDirection: 'top',
        width: mapContainer.clientWidth,
        height: mapContainer.clientHeight,
        selfWidth: contentSize.width,
        selfHeight: contentSize.height,
        borderPadding: this.borderPadding
      });

      this.containerStyle = this.getContainerStyle({
        x,
        y,
        padding: 10,
        width: containerSize.width,
        height: containerSize.height
      });
    }
  }

  $refs!: {
    containerRef: HTMLElement;
    contentRef: HTMLElement;
  };

  get containerSize() {
    return {
      width: this.$refs?.containerRef?.offsetWidth || 250,
      height: this.$refs?.containerRef?.offsetHeight || 100
    };
  }

  get contentSize() {
    return {
      width: this.$refs?.contentRef?.clientWidth || 250,
      height: this.$refs?.contentRef?.clientHeight || 100
    };
  }

  @Watch('viewState')
  @Watch('borderPadding')
  @Watch('value', { immediate: true })
  recalculate() {
    this.recalculatePosition(this.containerSize, this.contentSize);
  }
}
</script>

<style scoped lang="scss">
.data-viewer {
  min-width: 250px;
  max-width: 500px;
  padding: 0.75rem;
}
.header {
  min-height: 1.5rem;
  .label {
    margin: 0;
  }
}
.attributes {
  color: $black;
  .value {
    min-width: 50px;
    text-align: right;
  }
}
.close {
  margin: -0.25rem -0.25rem 0 0;
}
</style>
