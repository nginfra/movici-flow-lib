<template>
  <WidgetContainer collapsable>
    <template #collapse-title="{ collapsed }">
      <div
        class="is-flex-direction-row-reverse is-align-content-space-between is-flex is-align-items-center is-clickable"
        aria-controls="legend-container"
      >
        <b-tooltip
          position="is-left"
          size="is-small"
          type="is-black"
          :label="$t('flow.legend.label')"
          :active="collapsed"
          :delay="1000"
        >
          <b-icon pack="far" :icon="collapsed ? 'list' : 'minus-square'"></b-icon>
        </b-tooltip>
        <label class="label is-flex-grow-1 is-size-6" v-show="!collapsed">
          {{ $t('flow.legend.label') }}
        </label>
      </div>
    </template>
    <template #collapse-content>
      <div class="legend-container pr-2 overflow">
        <div class="legend" v-for="(legendItem, idx) in legendList" :key="idx">
          <div class="legend-header mb-1">
            <label class="is-italic is-size-6-half" v-if="legendItem.title">
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
          <ColorBucketLegend :value="legendItem" v-if="isBuckets(legendItem)" />
          <ColorGradientLegend :value="legendItem" v-if="isGradient(legendItem)" />
        </div>
      </div>
    </template>
  </WidgetContainer>
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
import WidgetContainer from './WidgetContainer.vue';

@Component({
  name: 'FlowLegend',
  components: { ColorBucketLegend, ColorGradientLegend, WidgetContainer }
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

<style scoped lang="scss"></style>
