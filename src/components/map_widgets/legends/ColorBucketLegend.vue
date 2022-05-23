<template>
  <ul class="buckets-container is-size-7">
    <li class="bucket" v-for="(colorLegend, idx) in reversedColors" :key="idx">
      <div class="is-flex pb-1" :class="isStatic ? 'static' : 'byValue'">
        <span class="is-flex is-align-items-center">
          <span
            class="color-wrap"
            :class="{
              icon: isIcon(value.visualizerType),
              line: isLine(value.visualizerType),
              point: isPoint(value.visualizerType),
              polygon: isPolygon(value.visualizerType)
            }"
            :style="bucketColorStyle(colorLegend[1], isPolygon(value.visualizerType))"
          />
          <span class="ml-2 legend-value" v-if="!isStatic">{{ colorLegend[0] }}</span>
        </span>
        <label class="label is-size-7 mb-1" :class="{ 'ml-2': isStatic }" v-if="idx < 1">
          {{ $t('flow.visualization.colorConfig.color') }}
        </label>
      </div>
    </li>
  </ul>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ColorLegendItem, FlowVisualizerType, RGBAColor } from '@movici-flow-common/types';
import { colorTripleToHex } from '@movici-flow-common/visualizers/maps/colorMaps';

@Component({ name: 'ColorBucketLegend' })
export default class ColorBucketLegend extends Vue {
  @Prop({ type: Object }) readonly value!: ColorLegendItem;

  get reversedColors() {
    const colors = [...this.value.colorLegends];
    return colors.reverse();
  }

  get isStatic() {
    return this.reversedColors.length === 1;
  }

  bucketColorStyle(color: RGBAColor, alpha = false) {
    const hex = colorTripleToHex(color),
      hexAlpha = colorTripleToHex(color) + 'CC';

    return {
      background: !alpha ? hex : hexAlpha,
      'border-color': hex
    };
  }

  isPolygon(type: FlowVisualizerType) {
    return type === FlowVisualizerType.POLYGONS;
  }

  isLine(type: FlowVisualizerType) {
    return type === FlowVisualizerType.LINES;
  }

  isPoint(type: FlowVisualizerType) {
    return type === FlowVisualizerType.POINTS;
  }

  isIcon(type: FlowVisualizerType) {
    return type === FlowVisualizerType.ICONS;
  }
}
</script>

<style scoped lang="scss">
ul.buckets-container {
  li {
    .static {
      flex-direction: row;
      align-items: center;
    }
    .byValue {
      flex-direction: column-reverse;
      align-items: flex-start;
    }
    span {
      display: inline-block;
      line-height: 1rem;
      &.legend-value {
        line-height: 16px;
      }
      &.color-wrap {
        line-height: 16px;
        &.line {
          min-width: 1rem;
          height: 0.5rem;
          margin: 0.25rem 0;
        }
        &.point {
          min-width: 1rem;
          height: 1rem;
          border-radius: 100%;
        }
        &.polygon {
          border: 2px solid;
          min-width: 1rem;
          height: 1rem;
        }
        &.icon {
          border-radius: 2px;
          width: 16px;
          height: 16px;
        }
      }
    }
  }
}
</style>
