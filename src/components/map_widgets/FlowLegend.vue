<template>
  <div v-if="legendList.length" class="popup-fixed">
    <div class="box">
      <b-collapse animation="slide" aria-id="legend-container">
        <template #trigger="{ open }">
          <div class="is-flex is-align-items-center" aria-controls="legend-container">
            <label class="label is-flex-grow-1 is-size-6 mb-0">
              {{ $t('flow.legend.label') }}
            </label>
            <b-icon size="is-small" pack="far" :icon="!open ? 'expand' : 'compress'"></b-icon>
          </div>
        </template>
        <div class="legend-container mt-2 pr-2 overflow">
          <div class="legend mt-2" v-for="(legendItem, idx) in legendList" :key="idx">
            <div class="legend-header mb-1">
              <label class="label is-size-6-half mb-0" v-if="legendItem.title">
                {{ legendItem.title }}
              </label>
              <label
                class="label has-text-weight-light is-uppercase is-size-7 has-text-grey"
                v-if="legendItem.label"
              >
                {{ legendItem.label }}
              </label>
            </div>
            <!-- Color Buckets -->
            <ColorBucketLegend :value="legendItem" v-if="isBuckets(legendItem)" />
            <!-- Color Gradient -->
            <ColorGradientLegend :value="legendItem" v-if="isGradient(legendItem)" />
          </div>
        </div>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import {
  ColorByValueLegendItem,
  FlowVisualizerType,
  LegendItem,
  ColorStaticLegendItem,
  ColorClause,
  ColorLegendItem
} from '@/flow/types';
import { ComposableVisualizerInfo } from '@/flow/visualizers/VisualizerInfo';
import ColorBucketLegend from './ColorBucketLegend.vue';
import ColorGradientLegend from './ColorGradientLegend.vue';

@Component({
  name: 'FlowLegend',
  components: { ColorBucketLegend, ColorGradientLegend }
})
export default class FlowLegend extends Vue {
  @Prop({ type: Array, default: () => [] }) value!: ComposableVisualizerInfo[];
  legendList: LegendItem[] = [];

  isBuckets(legendItem: LegendItem) {
    return legendItem.colorType === 'buckets';
  }

  isGradient(legendItem: LegendItem) {
    return legendItem.colorType === 'gradient';
  }

  @Watch('value', { immediate: true })
  visualizerToLegend(value: ComposableVisualizerInfo[]) {
    const legendList: LegendItem[] = [];
    for (const { settings, name, visible } of value) {
      if (visible && settings?.color) {
        const item = this.createColorLegendItem(settings.color, name, settings.type);
        if (item) {
          legendList.push(item);
        }
      }
    }
    this.legendList = legendList;
  }
  private createColorLegendItem(
    clause: ColorClause,
    name: string,
    type: FlowVisualizerType
  ): ColorLegendItem | null {
    const legend = clause.legend,
      baseConfig = {
        title: name,
        visualizerType: type,
        colorLegends: []
      };

    if (!legend) return null;

    if (clause.byValue) {
      return new ColorByValueLegendItem(
        {
          ...baseConfig,
          colorType: clause.byValue.type,
          label: legend.title || clause.byValue.attribute?.name
        },

        clause.byValue,
        legend
      );
    }
    if (clause.static) {
      return new ColorStaticLegendItem(
        {
          ...baseConfig,
          colorType: 'buckets'
        },
        clause.static,
        legend
      );
    }
    throw new Error('Unknown clause type');
  }
}
</script>

<style scoped lang="scss">
.box {
  min-width: 250px;
  max-width: 500px;
  padding: 0.75rem;
}
.legends {
  max-height: 400px;
  .legend {
    border-bottom: 1px solid $grey-lighter;
    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
