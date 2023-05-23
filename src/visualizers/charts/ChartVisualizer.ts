import { Backend } from '@movici-flow-common/types';
import { parsePropertyString } from '@movici-flow-common/utils';
import { DatasetDownloader } from '@movici-flow-common/utils/DatasetDownloader';
import { ChartOptions } from 'chart.js';
import { merge } from 'lodash';
import { colorTripleToHex, MoviciColors } from '../maps/colorMaps';
import { StreamingTapefile } from '../tapefile';
import { ChartVisualizerInfo, ChartVisualizerItem } from '../VisualizerInfo';
import { BaseVisualizer, VisualizerContext } from '../visualizers';

import { ChartDataset } from 'chart.js';
import { AnnotationOptions } from 'chartjs-plugin-annotation';

export interface ChartConfig {
  id: string;
  title: string;
  options: ChartOptions;
  data: DatasetConfig[];
}
export interface DatasetConfig {
  dataset: Omit<ChartDataset, 'data'>;
  tapefile: StreamingTapefile<number>;
  key: string,
  entityIdx: number;
}
export interface ChartVisualizerContext extends VisualizerContext<ChartVisualizerInfo> {
  backend: Backend;
}

function tapefileKey(item: ChartVisualizerItem) {
  return `${item.datasetName}:${item.entityGroup}:${item.attribute}`
}
export default class ChartVisualizer extends BaseVisualizer<ChartVisualizerInfo> {
  tapefiles: Record<string, StreamingTapefile<number>>;
  backend: Backend;

  constructor(config: ChartVisualizerContext) {
    super(config);
    this.backend = config.backend;
    this.tapefiles = {};
  }

  async doLoad(): Promise<void> {
    for (const item of this.info.items) {
      this.tapefiles[tapefileKey(item)] ??= this.tapefileStore.getTapefile<number>({
        store: new DatasetDownloader({
          scenarioUUID: this.info.scenarioUUID,
          datasetUUID: item.datasetUUID as string,
          backend: this.backend
        }),
        entityGroup: item.entityGroup,
        attributes: [parsePropertyString(item.attribute)]
      });
    }
  }

  mustReload() {
    return true;
  }

  private getOptions(): ChartOptions {
    const rv: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { beginAtZero: true, display: false, ticks: { stepSize: 1 } },
        y: { beginAtZero: true }
      }
    };
    merge(rv, this.info.settings);
    return rv;
  }

  getChart(): ChartConfig | null {
    if (!this.tapefiles) return null;
    const datasets: DatasetConfig[] = [];
    for (const item of this.info.items) {
      const key = tapefileKey(item)
      const tf = this.tapefiles[key];

      if (!tf) {
        console.error(`missing tapefile ${key}`);
        continue;
      }

      datasets.push({
        dataset: this.getChartDataset(item),
        entityIdx: item.entityIdx,
        key,
        tapefile: tf
      });
    }

    return {
      id: this.info.id,
      title: this.info.title,
      options: this.getOptions(),
      data: datasets
    };
  }

  getLineAnotation(timestamp: number): AnnotationOptions {
    return {
      type: 'line',
      xMin: timestamp,
      xMax: timestamp,
      borderColor: MoviciColors.DARK_GREY,
      borderWidth: 2,
      value: 100
    };
  }

  getChartDataset(item: ChartVisualizerItem) {
    return {
      ...item.settings,
      label: item.name,
      backgroundColor: colorTripleToHex(item.color),
      showLine: true,
      stepped: true,
      elements: {
        line: {
          backgroundColor: colorTripleToHex(item.color),
          borderColor: colorTripleToHex(item.color)
        },
        point: {
          radius: 2.5
        }
      }
    };
  }
}
