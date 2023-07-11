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
        class="legend-container pr-2 mt-2 overflow"
        v-for="(legendItem, idx) in legendList"
        :key="idx"
      >
        <div class="legend-header mb-2 is-flex">
          <StaticLegendThumbnails :modelValue="legendItem" />
          <label class="legend-title is-size-6-half" v-if="legendItem.title">
            {{ legendItem.title }}
          </label>
        </div>
        <div class="legend-content ml-4">
          <BucketLegend
            v-if="legendItem?.shape?.clauseType === 'byValue'"
            :modelValue="legendItem.shape"
            :visualizerType="legendItem.visualizerType"
            :isSimple="legendItem.isSimpleByValueLegend()"
            kind="shape"
          />
          <BucketLegend
            v-if="legendItem.icon?.clauseType === 'byValue'"
            :modelValue="legendItem.icon"
            :visualizerType="legendItem.visualizerType"
            :isSimple="legendItem.isSimpleByValueLegend()"
            kind="icon"
          />
          <template v-if="legendItem.color?.clauseType === 'byValue'">
            <BucketLegend
              v-if="isBuckets(legendItem.color)"
              :modelValue="legendItem.color"
              :visualizerType="legendItem.visualizerType"
              :isSimple="legendItem.isSimpleByValueLegend()"
              kind="color"
            />
            <ColorGradientLegend
              v-if="isGradient(legendItem.color)"
              :modelValue="legendItem.color"
              :isSimple="legendItem.isSimpleByValueLegend()"
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
  ColorLegendItem,
  ColorStaticLegendItem,
  IconByValueLegendItem,
  IconLegendItem,
  IconStaticLegendItem,
  VisualizerLegend,
  type ColorClause,
  type IconClause,
} from "@movici-flow-lib/types";
import type { ComposableVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import { computed } from "vue";
import BucketLegend from "./BucketLegend.vue";
import ColorGradientLegend from "./ColorGradientLegend.vue";
import StaticLegendThumbnails from "./StaticLegendThumbnails.vue";
import WidgetContainer from "./WidgetContainer.vue";

const props = defineProps<{
  modelValue: ComposableVisualizerInfo[];
}>();

function isBuckets(colorLegendItem: ColorLegendItem) {
  return (
    (colorLegendItem instanceof ColorByValueLegendItem &&
      colorLegendItem.colorType === "buckets") ||
    colorLegendItem instanceof ColorStaticLegendItem
  );
}

function isGradient(colorLegendItem: ColorLegendItem) {
  return (
    colorLegendItem instanceof ColorByValueLegendItem && colorLegendItem.colorType === "gradient"
  );
}

const legendList = computed(() => {
  const rv: VisualizerLegend[] = [];
  for (const { settings, name, visible } of props.modelValue) {
    if (!(settings && visible)) continue;

    let color: ColorLegendItem | null = null,
      icon: IconLegendItem | null = null,
      shape: IconLegendItem | null = null;

    if (settings.color?.legend) {
      color = createColorLegendItem(settings.color);
    }

    if (settings.icon?.legend) {
      icon = createIconLegendItem(settings.icon, "icon");
    }
    if (settings.shape?.legend) {
      shape = createIconLegendItem(settings.shape, "shape");
    }

    if (color || icon || shape) {
      const legendItem = new VisualizerLegend({
        title: name,
        visualizerType: settings.type,
        color,
        icon,
        shape,
      });

      rv.push(legendItem);
    }
  }
  return rv;
});

function createIconLegendItem(clause: IconClause, kind: "icon" | "shape"): IconLegendItem | null {
  const legend = clause?.legend;

  if (!legend) return null;

  if (clause?.static?.icon) {
    return new IconStaticLegendItem(clause.static);
  }
  if (clause?.byValue) {
    return new IconByValueLegendItem(clause.byValue, legend);
  }

  return null;
}

function createColorLegendItem(clause: ColorClause): ColorLegendItem | null {
  const legend = clause.legend;

  if (!legend) return null;

  if (clause.byValue) {
    return new ColorByValueLegendItem(clause.byValue, clause.byValue.type, legend);
  }
  if (clause.static) {
    return new ColorStaticLegendItem(clause.static);
  }
  throw new Error("Unknown clause type");
}
</script>

<style scoped lang="scss">
hr {
  margin: 0.25em 0;
}
.legend-title {
  font-size: 0.85rem;
  font-weight: bold;
  text-transform: uppercase;
}
</style>
