<template>
  <div class="chart-vis" v-if="charts.length && !loading">
    <div class="is-flex is-flex-direction-row-reverse" :disabled="charts.length">
      <span @click="toggleExpand" :class="{ expanded }">
        <o-icon
          :title="t('flow.visualization.graph.showCharts')"
          class="collapsed-icon"
          pack="far"
          :icon="expanded ? 'minus-square' : 'chart-line'"
        />
      </span>
    </div>
    <div class="chart-holder" v-if="expanded">
      <o-tabs
        v-if="charts.length"
        class="flow-tabs mr-5"
        :modelValue="activeChartId"
        @update:modelValue="$emit('update:activeChartId', $event)"
        :animated="false"
        :animateInitially="false"
      >
        <o-tab-item v-for="(chart, i) in charts" :key="chart.id" :value="chart.id">
          <template #header>
            <span>{{ chart.title }}</span>
            <div class="buttons mx-0" v-if="activeChartId === chart.id">
              <o-button
                icon-pack="far"
                icon-left="edit"
                size="small"
                class="ml-2 mr-0 is-borderless has-text-primary"
                :title="t('actions.edit')"
                @click="$emit('openConfig', i)"
              />
              <o-button
                icon-pack="far"
                icon-left="trash"
                size="small"
                class="mx-0 is-borderless has-text-primary"
                :title="t('actions.delete')"
                @click="removeChart(i)"
              />
            </div>
          </template>
        </o-tab-item>
      </o-tabs>
      <AttributeChart
        class="mt-3"
        ref="attributeChart"
        v-if="chartData && options && currentChartInfo"
        :id="activeChartId"
        :chartData="chartData"
        :chartOptions="options"
        :timestamp="timestamp"
        :customTimeFormat="customFormatter"
        :chartInfo="currentChartInfo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharts } from "@movici-flow-lib/composables/useCharts";
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import type { TimeOrientedSimulationInfo } from "@movici-flow-lib/types";
import type { TapefileStoreCollection } from "@movici-flow-lib/visualizers/TapefileStore";
import type { ChartVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import type { ChartData, Chart as ChartJS } from "chart.js";
import { computed, nextTick, ref, unref, watch } from "vue";
import AttributeChart from "./AttributeChart.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    modelValue: ChartVisualizerInfo[];
    timelineInfo: TimeOrientedSimulationInfo;
    tapefileStores: TapefileStoreCollection;
    timestamp?: number;
    activeChartId?: string;
    expanded: boolean;
    customTimeFormat?: (val: number) => string;
  }>(),
  { timestamp: 0, activeChartId: "" }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: ChartVisualizerInfo[]): void;
  (e: "update:activeChartId", val: string): void;
  (e: "update:expanded", val: boolean): void;
}>();

const { backend } = useFlowStore();
const attributeChart = ref<{ getChart: () => ChartJS | null } | null>(null);

const { loading, registry, activateChart, activeChart, setChartInfos, charts } = useCharts({
  tapefileStores: props.tapefileStores,
  backend: backend!,
  activeChartId: computed({
    get: () => props.activeChartId,
    set: (val?: string) => val && emit("update:activeChartId", val),
  }),
  updateChart: () => {
    attributeChart.value?.getChart()?.update();
  },
});

watch(() => props.timelineInfo, registry.setTimelineInfo.bind(registry), { immediate: true });
watch(
  () => props.activeChartId,
  (val) => activateChart(val),
  { immediate: true }
);
watch(() => props.modelValue, setChartInfos, { immediate: true });

const chartData = computed(() => {
  return (unref(activeChart)?.data as ChartData<"scatter">) ?? null;
});

// be sure to recycle the chart component when data changes to deal with reactivity issues. Seems
// to be an issue with vue-chart-3. Maybe there is a more elegant solution; haven't found it yet
const showChart = ref(true);
watch(chartData, () => {
  showChart.value = false;
  nextTick(() => (showChart.value = true));
});

const options = computed(() => {
  return activeChart.value?.options || null;
});
const currentChartInfo = computed(() => {
  return props.modelValue.find((i) => i.id === props.activeChartId);
});

function customFormatter(relativeTime: number) {
  return (
    props.customTimeFormat?.(
      relativeTime * props.timelineInfo.time_scale + props.timelineInfo.reference_time
    ) ?? String(relativeTime)
  );
}

function removeChart(idx: number) {
  const newactiveChartId = props.modelValue[Math.max(idx - 1, 0)]?.id ?? null;
  emit("update:activeChartId", newactiveChartId);
  emit(
    "update:modelValue",
    props.modelValue.filter((_, arrayIdx) => idx !== arrayIdx)
  );
}

function toggleExpand() {
  emit("update:expanded", !props.expanded);
}
</script>

<style scoped lang="scss">
:deep(.collapsed-icon) {
  &:hover {
    background: $white-ter;
  }
}
.expanded {
  position: absolute;
  right: 16px;
  top: 16px;
}
</style>
