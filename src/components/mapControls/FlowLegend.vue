<template>
  <WidgetContainer collapsable v-if="legendList.length">
    <template #collapse-title="{ collapsed }">
      <div
        class="is-flex-direction-row-reverse is-align-content-space-between is-flex is-align-items-center is-clickable"
        aria-controls="legend-container"
      >
        <o-icon
          class="collapsed-icon"
          :title="$t('flow.legend.label')"
          pack="far"
          :icon="collapsed ? 'list' : 'minus-square'"
        />
        <label class="label is-flex-grow-1 is-size-6" v-show="!collapsed">
          {{ $t("flow.legend.label") }}
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
          <IconLegend :modelValue="legendItem.icon" v-if="legendItem.icon" />
          <template v-if="legendItem.color">
            <ColorBucketLegend
              :modelValue="legendItem.color"
              :isSimple="legendItem.isSimpleLegend()"
              v-if="isBuckets(legendItem.color)"
            />
            <ColorGradientLegend
              :modelValue="legendItem.color"
              v-if="isGradient(legendItem.color)"
            />
          </template>
        </div>
        <hr v-if="idx < legendList.length - 1" />
      </div>
    </template>
  </WidgetContainer>
</template>

<script setup lang="ts">
import {
  ColorByValueLegendItem,
  FlowVisualizerType,
  ColorStaticLegendItem,
  type ColorClause,
  ColorLegendItem,
  LegendItem,
  IconLegendItem,
  type IconClause,
  IconStaticLegendItem,
  IconByValueLegendItem,
} from "@movici-flow-common/types";
import type { ComposableVisualizerInfo } from "@movici-flow-common/visualizers/VisualizerInfo";
import ColorBucketLegend from "./ColorBucketLegend.vue";
import IconLegend from "./IconLegend.vue";
import ColorGradientLegend from "./ColorGradientLegend.vue";
import WidgetContainer from "./WidgetContainer.vue";
import { computed } from "vue";

const props = defineProps<{
  modelValue: ComposableVisualizerInfo[];
}>();

function isBuckets(colorLegendItem: ColorLegendItem) {
  return colorLegendItem.colorType === "buckets";
}

function isGradient(colorLegendItem: ColorLegendItem) {
  return colorLegendItem.colorType === "gradient";
}

const legendList = computed(() => {
  const rv: LegendItem[] = [];
  for (const { settings, name, visible } of props.modelValue) {
    let color: ColorLegendItem | null = null,
      icon: { shape?: IconLegendItem; icon?: IconLegendItem } | null = null;

    if (visible) {
      if (settings?.color?.legend) {
        color = createColorLegendItem(settings.color, settings.type);
      }

      if (settings?.icon?.legend || settings?.shape?.legend) {
        icon = createIconLegendItem(settings?.shape ?? null, settings?.icon ?? null);
      }

      if (color || icon) {
        const legendItem = new LegendItem({
          title: name,
          color,
          icon,
        });

        rv.push(legendItem);
      }
    }
  }
  return rv;
});

function createIconLegendItem(shapeClause: IconClause | null, iconClause: IconClause | null) {
  const shapeLegend = shapeClause?.legend,
    iconLegend = iconClause?.legend;

  if (!shapeLegend && !iconLegend) return null;

  const iconsLegendItems: { shape?: IconLegendItem; icon?: IconLegendItem } = {};

  if (shapeClause?.static) {
    iconsLegendItems.shape = new IconStaticLegendItem(shapeClause.static, shapeLegend);
  } else if (shapeClause?.byValue) {
    iconsLegendItems.shape = new IconByValueLegendItem(shapeClause.byValue, shapeLegend);
  }

  if (iconClause?.static) {
    iconsLegendItems.icon = new IconStaticLegendItem(iconClause.static, iconLegend);
  } else if (iconClause?.byValue) {
    iconsLegendItems.icon = new IconByValueLegendItem(iconClause.byValue, iconLegend);
  }

  return iconsLegendItems;
}

function createColorLegendItem(
  clause: ColorClause,
  type: FlowVisualizerType
): ColorLegendItem | null {
  const legend = clause.legend,
    baseConfig = {
      visualizerType: type,
      colorLegends: [],
    };

  if (!legend) return null;

  if (clause.byValue) {
    return new ColorByValueLegendItem(
      {
        ...baseConfig,
        colorType: clause.byValue.type,
      },
      clause.byValue,
      legend
    );
  }
  if (clause.static) {
    return new ColorStaticLegendItem(
      {
        ...baseConfig,
        colorType: "buckets",
      },
      clause.static
    );
  }
  throw new Error("Unknown clause type");
}
</script>

<style scoped lang="scss">
hr {
  margin: 0.25em 0;
}
</style>