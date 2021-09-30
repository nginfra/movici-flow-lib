// import JSZip from 'jszip';
import { EntityGroupData, ExportConfig, TimeOrientedSimulationInfo } from '@/flow/src/types';
import Backend from '@/flow/src/api/backend';
import { entityGroupToCSV, objectToCSV } from '@/flow/src//utils/csvUtils';
import { DatasetDownloader } from '@/flow/src//utils/DatasetDownloader';

export function downloadAsFile(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(data);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportFromConfig({
  timelineInfo,
  backend,
  config
}: {
  timelineInfo: TimeOrientedSimulationInfo;
  backend: Backend;
  config: ExportConfig;
}): Promise<void> {
  const exportModule = new DataExporter(timelineInfo, backend);
  const res = await exportModule.config2blob(config);
  return downloadAsFile(res.blob, res.filename);
}
export default class DataExporter {
  timelineInfo!: TimeOrientedSimulationInfo | null;
  backend!: Backend;

  constructor(timelineInfo: TimeOrientedSimulationInfo | null, backend: Backend) {
    this.timelineInfo = timelineInfo;
    this.backend = backend;
  }

  // download zip file with all csv
  // configs2zip(configs: ExportConfig[]): Promise<Blob> {
  //   const zip = new JSZip();

  //   return Promise.all(
  //     configs.map(async (config: ExportConfig) => {
  //       const header = await this.generalDataHeader(config),
  //         data = await this.exportData(config);
  //       zip.file(this.fileName(config), new Blob([header, data]));
  //     })
  //   ).then(() => zip.generateAsync({ type: 'blob' }));
  // }

  // directly download .csv file
  async config2blob(config: ExportConfig): Promise<{ blob: Blob; filename: string }> {
    const header = await this.generalDataHeader(config),
      data = await this.exportData(config);

    return {
      blob: new Blob([header, data], { type: 'text/csv' }),
      filename: this.fileName(config)
    };
  }

  generalDataHeader(config: ExportConfig): string {
    const { projectName, dataset, scenario, timestamp = 0 } = config,
      unixTime_ = this.unixTime(timestamp) ?? 0,
      obj: Record<string, unknown> = {
        project: projectName,
        dataset: dataset?.display_name ?? dataset?.name ?? '-',
        scenario: scenario?.display_name ?? scenario?.name ?? '-',
        timestamp: this.currentFormattedTime(unixTime_)
      };

    return objectToCSV(obj);
  }

  async exportData(config: ExportConfig) {
    const { dataset, scenario, entityName, timestamp } = config,
      store = new DatasetDownloader({
        backend: this.backend,
        datasetUUID: dataset?.uuid ?? 'unknown',
        scenarioUUID: scenario?.uuid || undefined
      }),
      data = await store.getDatasetState<EntityGroupData<unknown>>({
        entityGroup: entityName,
        timestamp
      });

    return entityGroupToCSV(data);
  }

  fileName(config: ExportConfig): string {
    const { dataset, entityName, timestamp } = config;

    let rv = dataset?.display_name ?? dataset?.name ?? 'unknown_dataset';
    if (entityName) {
      rv += '-' + entityName;
    }
    if (timestamp) {
      rv += '-' + this.fileNameTime(timestamp);
    }
    return rv + '.csv';
  }

  fileNameTime(timestamp: number): string {
    const leadingZero = (val: number): string => ('0' + val).slice(-2);
    if (!this.unixTime) return '-';
    const date = new Date(this.unixTime(timestamp) ?? 0);

    return [
      date.getFullYear(),
      leadingZero(date.getMonth() + 1),
      leadingZero(date.getDate()),
      '-',
      leadingZero(date.getHours()),
      leadingZero(date.getMinutes()),
      leadingZero(date.getSeconds())
    ].join('');
  }

  unixTime(timestamp: number): number | null {
    return this.timelineInfo
      ? (timestamp * this.timelineInfo.time_scale + this.timelineInfo.reference_time) * 1000
      : null;
  }

  currentFormattedTime(unixTime: number): string {
    return unixTime ? new Date(unixTime).toLocaleString('NL-nl') : '-';
  }
}
