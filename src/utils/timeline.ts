import { ComponentProperty, EntityGroupData, EntityUpdate, Update } from '@/flow/types';
import { DatasetDownloader } from '@/flow/utils/DatasetDownloader';

export class TimelineDownloader {
  entityGroup: string;
  properties: ComponentProperty[];
  store: DatasetDownloader;
  reportProgress?: (p: number) => void;
  private progress: number;
  private maxProgress: number;
  constructor(
    entityGroup: string,
    properties: ComponentProperty[],
    store: DatasetDownloader,
    reportProgress?: (p: number) => void
  ) {
    this.entityGroup = entityGroup;
    this.properties = properties;
    this.store = store;
    this.reportProgress = reportProgress;
    this.progress = 0;
    this.maxProgress = 1;
  }

  async download<T>(): Promise<EntityUpdate<T>[]> {
    const updates = await this.store.getUpdateList();
    return await this.getUpdateData(updates);
  }

  updateProgress() {
    this.progress++;
    if (this.reportProgress) {
      this.reportProgress((this.progress / this.maxProgress) * 100);
    }
  }

  getUpdateData<T>(updatesList: Update[]): Promise<EntityUpdate<T>[]> {
    this.maxProgress = updatesList.length;
    const promises = [];
    for (let i = 0; i < updatesList.length; i++) {
      promises.push(
        this.store.getUpdateData(updatesList[i], this.entityGroup, this.properties).then(update => {
          this.updateProgress();
          return update;
        })
      );
    }
    return Promise.all(promises).then(upd => {
      return upd
        .filter(upd => {
          return upd?.data[this.entityGroup];
        })
        .map(upd => {
          return {
            timestamp: upd.timestamp,
            iteration: upd.iteration,
            data: upd.data[this.entityGroup] as EntityGroupData<T>
          };
        });
    });
  }
}
