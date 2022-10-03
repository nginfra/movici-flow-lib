<template>
  <div class="chart-vis" v-if="charts.length && !isLoading">
    <div class="is-flex is-flex-direction-row-reverse" :disabled="charts.length">
      <span @click="toggleExpand">
        <b-icon
          :title="$t('flow.visualization.graph.showCharts')"
          class="collapsed-icon"
          pack="far"
          :icon="expanded ? 'minus-square' : 'chart-line'"
        />
      </span>
    </div>
    <div class="chart-holder" v-if="expanded">
      <b-tabs
        v-if="charts.length"
        class="flow-tabs"
        :value="currentChartId"
        @input="$emit('update:currentChartId', $event)"
        :animated="false"
        :animateInitially="false"
      >
        <b-tab-item v-for="(chart, i) in charts" :key="chart.id" :value="chart.id">
          <template #header>
            <span>{{ chart.title }}</span>
            <div class="buttons mx-0" v-if="currentChartId === chart.id">
              <b-button
                icon-pack="far"
                icon-left="edit"
                size="is-small"
                class="ml-2 mr-0 is-borderless has-text-primary"
                :title="$t('actions.edit')"
                @click="$emit('openConfig', i)"
              />
              <b-button
                icon-pack="far"
                icon-left="trash"
                size="is-small"
                class="mx-0 is-borderless has-text-primary"
                :title="$t('actions.delete')"
                @click="removeChart(i)"
              />
            </div>
          </template>
        </b-tab-item>
      </b-tabs>
      <AttributeChart
        class="mt-3"
        :id="currentChartId"
        :chartData="chartData"
        :chartOptions="options"
        :timestamp="timestamp"
        :customTimeFormat="customFormatter"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { TimeOrientedSimulationInfo, Backend, ActionMenuItem } from '@movici-flow-common/types';
import AttributeChart from './AttributeChart.vue';
import { ChartVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import VisualizerManager from '@movici-flow-common/visualizers/VisualizerManager';
import ChartVisualizer, {
  ChartConfig,
  DatasetConfig
} from '@movici-flow-common/visualizers/charts/ChartVisualizer';
import { TapefileStoreCollection } from '@movici-flow-common/visualizers/TapefileStore';
import { flowStore } from '@movici-flow-common/store/store-accessor';
import {
  applyChartData,
  buildStreamingChartData,
  ChartDataPoint
} from '@movici-flow-common/visualizers/charts/builder';
import { ChartData, ChartDataset, ChartOptions } from 'chart.js';

@Component({
  name: 'ChartVis',
  components: {
    AttributeChart
  }
})
export default class ChartVis extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly value!: ChartVisualizerInfo[];
  @Prop({ type: Object, required: true }) readonly timelineInfo!: TimeOrientedSimulationInfo;
  @Prop({ type: Object, required: true }) readonly tapefileStores!: TapefileStoreCollection;
  @Prop({ type: Number, default: 0 }) timestamp!: number;
  @Prop({ type: String, default: '' }) currentChartId!: string;
  @Prop({ type: Boolean, default: false }) expanded!: boolean;
  @Prop({ type: Function, default: null })
  readonly customTimeFormat!: ((val: number) => string) | null;

  chartManager: VisualizerManager<ChartVisualizerInfo, ChartVisualizer> | null = null;
  registry: ChartRegistry = new ChartRegistry();
  charts: ChartConfig[] = [];
  isLoading = false;
  currentChart: {
    options: ChartOptions;
    data: ChartData;
  } | null = null;

  get backend(): Backend | null {
    return flowStore.backend;
  }

  get chartData(): ChartData | null {
    return this.currentChart?.data ?? null;
  }

  get options(): ChartOptions | null {
    return this.currentChart?.options || null;
  }

  get tabActions(): ActionMenuItem[] {
    return [
      {
        label: '' + this.$t('actions.edit'),
        icon: 'edit',
        iconPack: 'far',
        event: 'edit'
      },
      {
        label: '' + this.$t('actions.delete'),
        icon: 'trash',
        iconPack: 'far',
        event: 'delete'
      }
    ];
  }

  get customFormatter() {
    return (relativeTime: number) => {
      return this.customTimeFormat
        ? this.customTimeFormat(
            relativeTime * this.timelineInfo.time_scale + this.timelineInfo.reference_time
          )
        : relativeTime;
    };
  }
  ensureManager() {
    if (!this.chartManager && this.backend && this.tapefileStores) {
      this.chartManager = new VisualizerManager<ChartVisualizerInfo, ChartVisualizer>({
        backend: this.backend,
        tapefileStores: this.tapefileStores,
        visualizerFactory: createChartVisualizer,
        onSuccess: () => {
          this.updateCharts();
          this.isLoading = false;
        },
        onError: () => {
          this.isLoading = false;
        }
      });
    }

    return this.chartManager;
  }

  toggleExpand() {
    this.$emit('update:expanded', !this.expanded);
  }

  @Watch('timelineInfo', { immediate: true })
  setTimelineInfo() {
    this.registry.setTimelineInfo(this.timelineInfo);
  }

  @Watch('value', { immediate: true })
  handelChartInfos() {
    this.isLoading = true;
    const visualizers = this.ensureManager();
    if (visualizers) {
      visualizers
        .updateVisualizers(this.value.filter(info => !Object.keys(info.errors).length))
        .then(() => {});
    }
  }

  removeChart(idx: number) {
    const newCurrentChartId = this.value[Math.max(idx - 1, 0)]?.id ?? null;
    this.$emit('update:currentChartId', newCurrentChartId);
    this.$emit(
      'input',
      this.value.filter((val, arrayIdx) => idx !== arrayIdx)
    );
  }

  updateCharts() {
    const charts = (this.chartManager?.getVisualizers() ?? [])
      .map(v => v.getChart())
      .filter(c => c !== null) as ChartConfig[];
    this.registry.setCharts(charts);
    this.charts = charts;
    this.setCurrentChart(this.currentChartId);
  }

  @Watch('currentChartId', { immediate: true })
  setCurrentChart(currentChartId: string | null) {
    if (!currentChartId) {
      this.currentChart = null;
      return;
    }
    this.currentChart = this.registry.getChartByID(currentChartId);
  }

  @Watch('charts')
  ensureValidChartId() {
    let currentChartId = this.currentChartId;
    if (!this.registry.getChartByID(this.currentChartId)) {
      currentChartId = '';
    }
    if (!currentChartId && this.charts[0]) {
      this.$emit('update:currentChartId', this.charts[0].id);
    }
  }
}

function chartDataKey({ id, item }: { id: string; item: DatasetConfig }) {
  return `${id}:${item.tapefile.attribute}:${item.entityIdx}`;
}

class ChartRegistry {
  charts: Record<string, ChartConfig>;
  chartData: Record<string, ChartDataPoint[]>;
  timelineInfo: TimeOrientedSimulationInfo | null;

  constructor() {
    this.charts = {};
    this.chartData = {};
    this.timelineInfo = null;
  }

  setTimelineInfo(timelineInfo: TimeOrientedSimulationInfo | null) {
    this.timelineInfo = timelineInfo;
  }

  setCharts(charts: ChartConfig[]) {
    this.charts = {};

    for (const chart of charts) {
      this.charts[chart.id] = chart;
      for (const item of chart.data) {
        const key = chartDataKey({ id: chart.id, item });
        this.chartData[key] ??= this.buildChartData(item);
      }
    }
  }

  buildChartData(config: DatasetConfig): ChartDataPoint[] {
    const { tapefile, entityIdx } = config;
    const datasetData: ChartDataPoint[] = [];

    const cb = (data: [number, number][]) => {
      applyChartData(datasetData, data, this.timelineInfo);
    };
    buildStreamingChartData({
      idx: entityIdx,
      tapefile,
      onInitial: cb,
      onUpdate: cb
    });
    return datasetData;
  }

  getChartByID(id: string): { options: ChartOptions; data: ChartData } | null {
    const config = this.charts[id];
    if (!config) {
      return null;
    }

    return {
      options: config.options,
      data: this.getChartData(config)
    };
  }
  getChartData(config: ChartConfig): ChartData {
    const rv = {
      datasets: [] as ChartDataset[]
    };
    for (const item of config.data) {
      const chartData = this.chartData[chartDataKey({ id: config.id, item })];
      if (!chartData) {
        console.error(`No Chart and/or data found for id '${config.id}'`);
      }
      rv.datasets.push({
        ...item.dataset,
        data: chartData
      } as ChartDataset);
    }
    return rv;
  }
}

function createChartVisualizer(
  info: ChartVisualizerInfo,
  manager: VisualizerManager<ChartVisualizerInfo, ChartVisualizer>
): ChartVisualizer {
  return new ChartVisualizer({
    info,
    backend: manager.backend,
    tapefileStore: manager.tapefileStores.ensure(info.scenarioUUID)
  });
}
</script>

<style scoped lang="scss">
::v-deep {
  .collapsed-icon {
    &:hover {
      background: $white-ter;
    }
  }
}
</style>
