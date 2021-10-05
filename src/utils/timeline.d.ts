import { ComponentProperty, EntityUpdate, Update } from '@/types';
import { DatasetDownloader } from '@//utils/DatasetDownloader';
export declare class TimelineDownloader {
    entityGroup: string;
    properties: ComponentProperty[];
    store: DatasetDownloader;
    reportProgress?: (p: number) => void;
    private progress;
    private maxProgress;
    constructor(entityGroup: string, properties: ComponentProperty[], store: DatasetDownloader, reportProgress?: (p: number) => void);
    download<T>(): Promise<EntityUpdate<T>[]>;
    updateProgress(): void;
    getUpdateData<T>(updatesList: Update[]): Promise<EntityUpdate<T>[]>;
}
