import type { Backend, TimeOrientedSimulationInfo } from "@movici-flow-lib/types";
import type { TapefileStoreCollection } from "@movici-flow-lib/visualizers/TapefileStore";
import type { ChartVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import VisualizerManager from "@movici-flow-lib/visualizers/VisualizerManager";
import type {
  ChartConfig,
  DatasetConfig,
} from "@movici-flow-lib/visualizers/charts/ChartVisualizer";
import ChartVisualizer from "@movici-flow-lib/visualizers/charts/ChartVisualizer";
import {
  applyChartData,
  buildStreamingChartData,
  type ChartDataPoint,
} from "@movici-flow-lib/visualizers/charts/builder";
import type { ChartData, ChartDataset, ChartOptions } from "chart.js";
import { markRaw, ref, shallowRef, watch, type Ref } from "vue";

export function useCharts({
  tapefileStores,
  backend,
  activeChartId,
  updateChart,
}: {
  tapefileStores: TapefileStoreCollection;
  backend: Backend;
  activeChartId: Ref<string>;
  updateChart?: () => void;
}) {
  const loading = ref(false);
  const activeChart = shallowRef(null) as Ref<{
    options: ChartOptions;
    data: ChartData;
  } | null>;

  const charts = ref([]) as Ref<ChartConfig[]>;

  const registry = markRaw(new ChartRegistry(updateChart));
  const chartManager = new VisualizerManager<ChartVisualizerInfo, ChartVisualizer>({
    backend,
    tapefileStores,
    visualizerFactory: createChartVisualizer,
    onSuccess: () => {
      updateCharts();
      loading.value = false;
    },
    onError: () => {
      loading.value = false;
    },
  });

  function activateChart(id?: string) {
    activeChart.value = id ? registry.getChartByID(id) : null;
  }
  watch(activeChartId, activateChart);
  watch(
    charts,
    () => {
      if (activeChartId.value && registry.getChartByID(activeChartId.value)) return;
      activeChartId.value = charts.value[0]?.id;
    },
    { immediate: true }
  );

  async function setChartInfos(infos: ChartVisualizerInfo[]) {
    loading.value = true;
    await chartManager.updateVisualizers(infos);
  }

  function updateCharts() {
    const newCharts = (chartManager.getVisualizers() ?? [])
      .map((v) => v.getChart())
      .filter((c) => c !== null) as ChartConfig[];
    registry.setChartConfigs(newCharts);
    charts.value = newCharts;
    activateChart(activeChartId.value);
  }

  return { loading, activeChart, activateChart, registry, setChartInfos, charts };
}

function createChartVisualizer(
  info: ChartVisualizerInfo,
  manager: VisualizerManager<ChartVisualizerInfo, ChartVisualizer>
): ChartVisualizer {
  return new ChartVisualizer({
    info,
    backend: manager.backend,
    tapefileStore: manager.tapefileStores.ensure(info.scenarioUUID),
  });
}
function chartDataKey({ id, item }: { id: string; item: DatasetConfig }) {
  return `${id}:${item.key}:${item.entityIdx}`;
}

class ChartRegistry {
  charts: Record<string, ChartConfig>;
  chartData: Record<string, ChartDataPoint[]>;
  timelineInfo: TimeOrientedSimulationInfo | null;
  onUpdate?: () => void;
  constructor(updateChart?: () => void) {
    this.charts = {};
    this.chartData = {};
    this.timelineInfo = null;
    this.onUpdate = updateChart;
  }

  setTimelineInfo(timelineInfo: TimeOrientedSimulationInfo | null) {
    this.timelineInfo = timelineInfo;
  }

  setChartConfigs(charts: ChartConfig[]) {
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
      this.onUpdate?.();
    };
    buildStreamingChartData({
      idx: entityIdx,
      tapefile,
      onInitial: cb,
      onUpdate: cb,
    });
    return datasetData;
  }

  getChartByID(id: string): { id: string; options: ChartOptions; data: ChartData } | null {
    const config = this.charts[id];
    if (!config) {
      return null;
    }

    return {
      id,
      options: config.options,
      data: this.getChartData(config),
    };
  }

  getChartData(config: ChartConfig): ChartData {
    const rv = {
      datasets: [] as ChartDataset[],
    };
    for (const item of config.data) {
      const chartData = this.chartData[chartDataKey({ id: config.id, item })];
      if (!chartData) {
        console.error(`No Chart and/or data found for id '${config.id}'`);
      }
      rv.datasets.push({
        ...item.dataset,
        data: chartData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
    return rv;
  }
}
