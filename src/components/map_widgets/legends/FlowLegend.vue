<template>
  <WidgetContainer collapsable v-if="legendList.length">
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
      <div
        class="legend-container pr-2 overflow"
        v-for="(legendItem, idx) in legendList"
        :key="idx"
      >
        <div class="legend-header mb-1">
          <label class="is-italic is-size-6-half" v-if="legendItem.title">
            {{ legendItem.title }}
          </label>
        </div>
        <div class="legend-content">
          <IconLegend :value="legendItem.icon" v-if="legendItem.icon" />
          <template v-if="legendItem.color">
            <ColorBucketLegend :value="legendItem.color" v-if="isBuckets(legendItem.color)" />
            <ColorGradientLegend :value="legendItem.color" v-if="isGradient(legendItem.color)" />
          </template>
        </div>
        <hr v-if="idx < legendList.length - 1" />
      </div>
    </template>
  </WidgetContainer>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import {
  ColorByValueLegendItem,
  FlowVisualizerType,
  ColorStaticLegendItem,
  ColorClause,
  ColorLegendItem,
  LegendItem,
  IconLegendItem,
  IconClause,
  IconStaticLegendItem
} from '@movici-flow-common/types';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import ColorBucketLegend from '../legends/ColorBucketLegend.vue';
import IconLegend from '../legends/IconLegend.vue';
import ColorGradientLegend from '../legends/ColorGradientLegend.vue';
import WidgetContainer from '../WidgetContainer.vue';

@Component({
  name: 'FlowLegend',
  components: { IconLegend, ColorBucketLegend, ColorGradientLegend, WidgetContainer }
})
export default class FlowLegend extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly value!: ComposableVisualizerInfo[];
  legendList: LegendItem[] = [];

  isBuckets(colorLegendItem: ColorLegendItem) {
    return colorLegendItem.colorType === 'buckets';
  }

  isGradient(colorLegendItem: ColorLegendItem) {
    return colorLegendItem.colorType === 'gradient';
  }

  @Watch('value', { immediate: true })
  visualizerToLegend(value: ComposableVisualizerInfo[]) {
    const legendList: LegendItem[] = [];
    for (const { settings, name, visible } of value) {
      let color: ColorLegendItem | null = null,
        icon: { shape?: IconLegendItem; icon?: IconLegendItem } | null = null;

      if (visible) {
        if (settings?.color?.legend) {
          color = this.createColorLegendItem(settings.color, settings.type);
        }

        if (settings?.icon?.legend || settings?.shape?.legend) {
          icon = this.createIconLegendItem(settings?.shape ?? null, settings?.icon ?? null);
        }

        if (color || icon) {
          const legendItem = new LegendItem({
            title: name,
            color,
            icon
          });

          legendList.push(legendItem);
        }
      }
    }

    this.legendList = legendList;
  }

  private createIconLegendItem(shapeClause: IconClause | null, iconClause: IconClause | null) {
    const shapeLegend = shapeClause?.legend,
      iconLegend = iconClause?.legend;

    if (!shapeLegend && !iconLegend) return null;

    const iconsLegendItems: { shape?: IconLegendItem; icon?: IconLegendItem } = {};

    if (shapeClause?.static) {
      iconsLegendItems.shape = new IconStaticLegendItem(shapeClause.static, shapeLegend);
    }

    if (iconClause?.static) {
      iconsLegendItems.icon = new IconStaticLegendItem(iconClause.static, iconLegend);
    }

    return iconsLegendItems;
  }

  private createColorLegendItem(
    clause: ColorClause,
    type: FlowVisualizerType
  ): ColorLegendItem | null {
    const legend = clause.legend,
      baseConfig = {
        visualizerType: type,
        colorLegends: []
      };

    if (!legend) return null;

    if (clause.byValue) {
      return new ColorByValueLegendItem(
        {
          ...baseConfig,
          colorType: clause.byValue.type
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
hr {
  margin: 0.25em 0;
}
</style>
