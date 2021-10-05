import { ExportConfig, TimeOrientedSimulationInfo } from '@/types';
import Backend from '@/api/backend';
export declare function downloadAsFile(data: Blob, filename: string): void;
export declare function exportFromConfig({ timelineInfo, backend, config }: {
    timelineInfo: TimeOrientedSimulationInfo;
    backend: Backend;
    config: ExportConfig;
}): Promise<void>;
export default class DataExporter {
    timelineInfo: TimeOrientedSimulationInfo | null;
    backend: Backend;
    constructor(timelineInfo: TimeOrientedSimulationInfo | null, backend: Backend);
    config2blob(config: ExportConfig): Promise<{
        blob: Blob;
        filename: string;
    }>;
    generalDataHeader(config: ExportConfig): string;
    exportData(config: ExportConfig): Promise<string>;
    fileName(config: ExportConfig): string;
    fileNameTime(timestamp: number): string;
    unixTime(timestamp: number): number | null;
    currentFormattedTime(unixTime: number): string;
}
