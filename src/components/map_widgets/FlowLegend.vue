<template>
  <div v-if="legendList.length" class="legends popup-fixed" :class="{ minimized: !isOpen }">
    <div class="box">
      <b-collapse animation="none " aria-id="legend-container" v-model="isOpen">
        <template #trigger="{ open }">
          <div
            class="is-flex-direction-row-reverse is-align-content-space-between is-flex is-align-items-center is-clickable"
            aria-controls="legend-container"
          >
            <b-icon title="Legend" pack="far" :icon="!open ? 'list' : 'expand'"></b-icon>
            <label class="label is-flex-grow-1 is-size-6 mb-0" v-show="open">
              {{ $t('flow.legend.label') }}
            </label>
          </div>
        </template>
        <div class="legend-container mt-2 pr-2 overflow">
          <div class="legend mt-2" v-for="(legendItem, idx) in legendList" :key="idx">
            <div class="legend-header mb-1">
              <label class="label is-size-6-half mb-0" v-if="legendItem.title">
                {{ legendItem.title }}
              </label>
              <label
                class="label has-text-weight-light is-size-7 has-text-grey"
                v-if="legendItem.label"
              >
                {{ legendItem.label }}
                <strong v-if="legendItem.unit">({{ legendItem.unit }})</strong>
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
} from '@movici-flow-common/types';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import ColorBucketLegend from './ColorBucketLegend.vue';
import ColorGradientLegend from './ColorGradientLegend.vue';

@Component({
  name: 'FlowLegend',
  components: { ColorBucketLegend, ColorGradientLegend }
})
export default class FlowLegend extends Vue {
  @Prop({ type: Array, default: () => [] }) value!: ComposableVisualizerInfo[];
  legendList: LegendItem[] = [];
  isOpen = true;

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
        const item = this.createColorLegendItem(
          settings.color,
          name,
          settings.type,
          settings.color?.byValue?.attribute?.unit
        );
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
    type: FlowVisualizerType,
    unit?: string
  ): ColorLegendItem | null {
    const legend = clause.legend,
      baseConfig = {
        title: name,
        visualizerType: type,
        colorLegends: [],
        unit
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
.legends {
  &.minimized {
    max-width: 3rem;
    max-height: 3rem;
    .box {
      min-width: auto;
      max-width: auto;
    }
  }
  .box {
    min-width: 200px;
    max-width: 300px;
    padding: 0.75rem;
  }
}
</style>
