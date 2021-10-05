import { entityGroupToCSV, objectToCSV } from '@//utils/csvUtils';
import { DatasetDownloader } from '@//utils/DatasetDownloader';
export function downloadAsFile(data, filename) {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
}
export async function exportFromConfig({ timelineInfo, backend, config }) {
    const exportModule = new DataExporter(timelineInfo, backend);
    const res = await exportModule.config2blob(config);
    return downloadAsFile(res.blob, res.filename);
}
export default class DataExporter {
    constructor(timelineInfo, backend) {
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
    async config2blob(config) {
        const header = await this.generalDataHeader(config), data = await this.exportData(config);
        return {
            blob: new Blob([header, data], { type: 'text/csv' }),
            filename: this.fileName(config)
        };
    }
    generalDataHeader(config) {
        var _a, _b, _c, _d, _e;
        const { projectName, dataset, scenario, timestamp = 0 } = config, unixTime_ = (_a = this.unixTime(timestamp)) !== null && _a !== void 0 ? _a : 0, obj = {
            project: projectName,
            dataset: (_c = (_b = dataset === null || dataset === void 0 ? void 0 : dataset.display_name) !== null && _b !== void 0 ? _b : dataset === null || dataset === void 0 ? void 0 : dataset.name) !== null && _c !== void 0 ? _c : '-',
            scenario: (_e = (_d = scenario === null || scenario === void 0 ? void 0 : scenario.display_name) !== null && _d !== void 0 ? _d : scenario === null || scenario === void 0 ? void 0 : scenario.name) !== null && _e !== void 0 ? _e : '-',
            timestamp: this.currentFormattedTime(unixTime_)
        };
        return objectToCSV(obj);
    }
    async exportData(config) {
        var _a;
        const { dataset, scenario, entityName, timestamp } = config, store = new DatasetDownloader({
            backend: this.backend,
            datasetUUID: (_a = dataset === null || dataset === void 0 ? void 0 : dataset.uuid) !== null && _a !== void 0 ? _a : 'unknown',
            scenarioUUID: (scenario === null || scenario === void 0 ? void 0 : scenario.uuid) || undefined
        }), data = await store.getDatasetState({
            entityGroup: entityName,
            timestamp
        });
        return entityGroupToCSV(data);
    }
    fileName(config) {
        var _a, _b;
        const { dataset, entityName, timestamp } = config;
        let rv = (_b = (_a = dataset === null || dataset === void 0 ? void 0 : dataset.display_name) !== null && _a !== void 0 ? _a : dataset === null || dataset === void 0 ? void 0 : dataset.name) !== null && _b !== void 0 ? _b : 'unknown_dataset';
        if (entityName) {
            rv += '-' + entityName;
        }
        if (timestamp) {
            rv += '-' + this.fileNameTime(timestamp);
        }
        return rv + '.csv';
    }
    fileNameTime(timestamp) {
        var _a;
        const leadingZero = (val) => ('0' + val).slice(-2);
        if (!this.unixTime)
            return '-';
        const date = new Date((_a = this.unixTime(timestamp)) !== null && _a !== void 0 ? _a : 0);
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
    unixTime(timestamp) {
        return this.timelineInfo
            ? (timestamp * this.timelineInfo.time_scale + this.timelineInfo.reference_time) * 1000
            : null;
    }
    currentFormattedTime(unixTime) {
        return unixTime ? new Date(unixTime).toLocaleString('NL-nl') : '-';
    }
}
