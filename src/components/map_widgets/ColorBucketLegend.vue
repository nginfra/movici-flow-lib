<template>
  <ul class="buckets-container is-size-7">
    <li class="bucket pb-2" v-for="(colorLegend, idy) in reversedColors" :key="idy">
      <div class="is-flex">
        <span
          class="color-wrap"
          :class="{
            line: isLine(value.visualizerType),
            point: isPoint(value.visualizerType),
            polygon: isPolygon(value.visualizerType)
          }"
          :style="bucketColorStyle(colorLegend[1], isPolygon(value.visualizerType))"
        >
        </span>
        <span class="ml-2 legend-value">{{ colorLegend[0] }}</span>
      </div>
    </li>
  </ul>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { FlowVisualizerType, LegendItem, RGBAColor } from '@/types';
import { colorTripleToHex } from '@/visualizers/maps/colorMaps';

@Component({
  name: 'ColorBucketLegend'
})
export default class ColorBucketLegend extends Vue {
  @Prop({ type: Object }) value!: LegendItem;

  get reversedColors() {
    const colors = [...this.value.colorLegends];
    return colors.reverse();
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
}
</script>

<style scoped lang="scss">
ul.buckets-container {
  li {
    span {
      display: inline-block;
      line-height: 1rem;
      &.color-wrap {
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
      }
    }
  }
}
</style>
