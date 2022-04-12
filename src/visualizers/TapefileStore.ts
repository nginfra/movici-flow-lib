import {
  ComponentProperty,
  EntityGroupData,
  EntityGroupSpecialValues,
  EntityUpdate,
  Update,
  UpdateWithData,
  UUID
} from '@movici-flow-common/types';
import { DatasetDownloader } from '@movici-flow-common/utils/DatasetDownloader';
import { heapPop, heapPush, PriorityQueue } from '@movici-flow-common/utils/queue';
import StatusTracker from '@movici-flow-common/utils/StatusTracker';
import { Index, SinglePropertyTapefile, TapefileWriter } from './tapefile';
import { PrioritizedTask, BatchedTaskDispatcher, ITaskDispatcher, Task } from './tasks';

export class TapefileStore {
  // keys in TapefileStore.tapefiles are `datasetUUID:entityGroup:attribute`. See also
  // `TapefileStore.ensureTapefile`
  private tapefiles: Record<string, StreamingTapefile<unknown>>;
  private statusTrackers: Map<StreamingTapefile<unknown>, [number, StatusTracker][]>;
  private currentProgress: Map<StreamingTapefile<unknown>, Record<string, number>>;
  private onDataCallback?: (timestamp: number) => void;
  private tasks: ITaskDispatcher<Task<unknown>>;
  constructor(config?: { onData?: (ts: number) => void; onReady?(): void }) {
    this.tapefiles = {};
    this.tasks = new BatchedTaskDispatcher({
      BATCH_SIZE: 20,
      queue: new PriorityQueue<PrioritizedTask<unknown>>((a, b) => a.priority - b.priority),
      onReady: () => {
        config?.onReady?.();
        this.startIdleTasks();
      }
    });
    this.statusTrackers = new Map();
    this.currentProgress = new Map();
    this.onDataCallback = config?.onData;
  }

  /** makes sure a tapefile exist. If it doesn't exists, it creates a new one.
   * return: a tuple containing the new tapefile and a boolean whether or not the tapefile has just
   *    been created
   */
  private ensureTapefile<T>(
    datasetUUID: UUID,
    entityGroup: string,
    attribute: string
  ): [StreamingTapefile<T>, boolean] {
    const key = `${datasetUUID}:${entityGroup}:${attribute}`,
      mustCreate = this.tapefiles[key] === undefined;
    if (mustCreate) {
      this.tapefiles[key] ??= new StreamingTapefile<T>(attribute);
      this.tapefiles[key].onData((ts: number) => {
        this.onDataCallback?.(ts);
      });
    }
    return [this.tapefiles[key] as StreamingTapefile<T>, mustCreate];
  }

  getTapefiles<T>({
    entityGroup,
    attributes,
    store,
    status
  }: {
    entityGroup: string;
    attributes: ComponentProperty[];
    store: DatasetDownloader;
    status?: StatusTracker;
  }): StreamingTapefile<T>[] {
    const newTapefiles: StreamingTapefile<T>[] = [],
      tapefiles: StreamingTapefile<T>[] = [];
    for (const attr of attributes) {
      const [tapefile, created] = this.ensureTapefile<T>(store.datasetUUID, entityGroup, attr.name);
      if (created) {
        newTapefiles.push(tapefile);
      }
      tapefiles.push(tapefile);
    }
    if (newTapefiles.length) {
      getMultipleTapefilesTasks({
        entityGroup,
        tapefiles: newTapefiles,
        store,
        onProgress: (val: number, task: string) => {
          this.reportProgress(newTapefiles, task, val);
        },
        onError: (error: unknown, task: string) => {
          this.reportError(newTapefiles, task, error);
        }
      }).then(tasks => {
        tasks.forEach(t => this.tasks.push(t));
      });
      for (const tapefile of newTapefiles) {
        this.currentProgress.set(tapefile, { initData: 0, updates: 0 });
      }
    }
    if (status) {
      for (const tf of tapefiles) {
        const id = status.register(['initData', 'updates']);
        let trackers = this.statusTrackers.get(tf);
        if (!trackers) {
          trackers = [];
          this.statusTrackers.set(tf, trackers);
        }
        trackers.push([id, status]);
        this.reportCurrentProgress(tf, id, status);
      }
    }

    return tapefiles;
  }

  reportProgress(tapefiles: StreamingTapefile<unknown>[], task: string, val: number) {
    for (const tapefile of tapefiles) {
      const currentProgress = this.currentProgress.get(tapefile);
      if (currentProgress) {
        currentProgress[task] = val;
      }
      for (const [id, tracker] of this.statusTrackers.get(tapefile) ?? []) {
        tracker.updateProgress(id, task, val);
      }
    }
  }

  reportError(tapefiles: StreamingTapefile<unknown>[], task: string, error: unknown) {
    for (const tapefile of tapefiles) {
      for (const [id, tracker] of this.statusTrackers.get(tapefile) ?? []) {
        tracker.setError(id, task, error);
      }
    }
  }

  reportCurrentProgress(tapefile: StreamingTapefile<unknown>, id: number, tracker: StatusTracker) {
    for (const [task, val] of Object.entries(this.currentProgress.get(tapefile) ?? {})) {
      tracker.updateProgress(id, task, val);
    }
  }
  private startIdleTasks() {
    for (const tapefile of Object.values(this.tapefiles)) {
      tapefile.calculateRollbacksOnIdle();
    }
  }
}

/**
 *  create and return the tasks necessary to download and fill multiple StreamingTapefiles for the
 *  same entity group. We can combine requests for multiple attributes into a single request per
 *  update, resulting in fewer requests
 */
async function getMultipleTapefilesTasks({
  entityGroup,
  tapefiles,
  store,
  onError,
  onProgress
}: {
  entityGroup: string;
  tapefiles: StreamingTapefile<unknown>[];
  store: DatasetDownloader;
  onError?: (err: unknown, task: string) => void;
  onProgress?: (val: number, task: string) => void;
}): Promise<PrioritizedTask<unknown>[]> {
  const tasks: PrioritizedTask<unknown>[] = [];
  const attributes: ComponentProperty[] = tapefiles.map(t => {
    return { name: t.attribute, component: null };
  });
  tasks.push(
    getInitDataTask({
      store,
      entityGroup,
      attributes,
      tapefiles,
      onError: (err: unknown) => onError?.(err, 'initData'),
      onDone: () => onProgress?.(100, 'initData')
    })
  );
  const updates = await store.getUpdateList(),
    total = updates.length;
  if (!total) {
    onProgress?.(100, 'updates');
    return tasks;
  }
  let tasksDone = 0;
  for (const [sequenceNumber, update] of updates.entries()) {
    tasks.push(
      getUpdateDataTask({
        update,
        sequenceNumber,
        store,
        entityGroup,
        attributes,
        tapefiles,
        onError: (err: unknown) => onError?.(err, 'updates'),
        onDone: () => {
          onProgress?.((++tasksDone / total) * 100, 'updates');
        }
      })
    );
  }
  return tasks;
}

function getInitDataTask({
  store,
  entityGroup,
  attributes,
  tapefiles,
  onError,
  onDone
}: {
  store: DatasetDownloader;
  entityGroup: string;
  attributes: ComponentProperty[];
  tapefiles: StreamingTapefile<unknown>[];
  onError?: (err: unknown) => void;
  onDone?: () => void;
}): PrioritizedTask<[EntityGroupData<unknown>, EntityGroupSpecialValues]> {
  return {
    getTask() {
      return Promise.all([
        store.getInitialData<EntityGroupData<unknown>>({
          entityGroup,
          properties: attributes
        }),
        store.getSpecialValues(entityGroup)
      ]);
    },

    onDone([initialData, specialValues]: [EntityGroupData<unknown>, EntityGroupSpecialValues]) {
      {
        const index = new Index(initialData.id);
        for (const tapefile of tapefiles) {
          tapefile.initialize({
            index,
            initialData,
            specialValue: specialValues[tapefile.attribute]
          });
        }
        onDone?.();
      }
    },

    onError: (err: unknown) => {
      onError ? onError(err) : console.error(err);
      onDone?.();
    },

    priority: -1
  };
}

function getUpdateDataTask({
  update,
  sequenceNumber,
  store,
  entityGroup,
  attributes,
  tapefiles,
  onError,
  onDone
}: {
  update: Update;
  sequenceNumber: number;
  store: DatasetDownloader;
  entityGroup: string;
  attributes: ComponentProperty[];
  tapefiles: StreamingTapefile<unknown>[];
  onError?: (err: unknown) => void;
  onDone?: () => void;
}) {
  return {
    getTask() {
      return store.getUpdateData(update, entityGroup, attributes);
    },
    onDone: (upd: UpdateWithData) => {
      const data = upd?.data[entityGroup] ?? {};
      for (const tapefile of tapefiles) {
        tapefile.addUpdate(
          {
            timestamp: upd.timestamp,
            iteration: upd.iteration,
            data
          },
          sequenceNumber
        );
      }
      onDone?.();
    },
    onError: (err: unknown) => {
      onError ? onError(err) : console.error(err);
      onDone?.();
    },

    priority: update.timestamp
  };
}
class StreamingTapefile<T> {
  attribute: string;
  IDLE_MS = 3000;
  private pending: [number, EntityUpdate<T>][];
  private nextUpdateSequence: number;
  private inner?: SinglePropertyTapefile<T>;
  private writer?: TapefileWriter<T>;
  private worker?: IdleWorker;
  private timestampCallbacks: ((timestamp: number) => void)[];

  constructor(attribute: string) {
    this.attribute = attribute;
    this.pending = [];

    this.nextUpdateSequence = -1; // -1 means waiting for init data
    this.timestampCallbacks = [];
  }
  get initialized() {
    return this.nextUpdateSequence >= 0;
  }
  get data() {
    return this.inner?.data ?? [];
  }
  moveTo(time: number) {
    this.worker?.notIdle();
    return this.inner?.moveTo(time);
  }
  copyState(): T[] {
    return this.inner?.copyState() ?? [];
  }
  initialize({
    index,
    initialData,
    specialValue
  }: {
    index: Index;
    initialData: EntityGroupData<T>;
    specialValue?: T;
  }) {
    if (this.initialized) throw new Error(`Tapefile for ${this.attribute} Already initialized`);
    this.inner = new SinglePropertyTapefile({
      componentProperty: { name: this.attribute, component: null },
      length: index.length,
      specialValue
    });
    this.writer = new TapefileWriter(index, this.inner, this.attribute);
    this.addUpdate(
      {
        timestamp: 0,
        iteration: -1,
        data: initialData
      },
      -1
    );
  }
  addUpdate(update: EntityUpdate<T>, sequenceNumber: number) {
    this.pendUpdate(update, sequenceNumber);
    if (!this.writer) {
      return;
    }
    let newDataTimestamp: number | null = null;
    while (this.pending.length && this.pending[0][0] === this.nextUpdateSequence) {
      const nextUpdate = (
        heapPop(this.pending, (a, b) => a[0] - b[0]) as [number, EntityUpdate<T>]
      )[1];
      this.writer.appendUpdate(nextUpdate);
      this.nextUpdateSequence++;
      newDataTimestamp = nextUpdate.timestamp;
    }
    if (newDataTimestamp !== null) {
      for (const cb of this.timestampCallbacks) {
        cb(newDataTimestamp);
      }
    }
  }
  private pendUpdate(update: EntityUpdate<T>, sequenceNumber: number) {
    heapPush(
      this.pending,
      [sequenceNumber, update] as [number, EntityUpdate<T>],
      (a, b) => a[0] - b[0]
    );
  }
  calculateRollbacksOnIdle() {
    this.worker = new IdleWorker(this.calculateNextRollback.bind(this), this.IDLE_MS);
  }
  calculateNextRollback(): boolean {
    // this function can be given as a task for the IdleWorker. It returns a boolean that indicates
    // whether this task must be run again directly after completion
    if (!this.inner) return false;
    return this.inner.calculateNextRollback();
  }

  onData(cb: (timestamp: number) => void) {
    this.timestampCallbacks.push(cb);
  }
}

/**
 * Idea for deferring some calculation until we're idle. Can be used to lazily evaluate reverse
 * updates in StreamingTapefile
 */

class IdleWorker {
  private task: () => boolean;
  private idleSince: number;
  readonly minIdleMiliseconds: number;
  private running: boolean;
  constructor(task: () => boolean, minIdleMiliseconds: number) {
    this.task = task;
    this.minIdleMiliseconds = minIdleMiliseconds;
    this.idleSince = Date.now();
    this.schedule(this.minIdleMiliseconds);
    this.running = true;
  }
  get currentIdleTime() {
    return Date.now() - this.idleSince;
  }

  /**
   * Schedule a task to run at the first moment when we're idle. If the task indicates
   * (by return value) that there are more tasks pending, we wait until the next tick and try to
   * run the next task. If we're not idle when we try to run the task, we wait until we've reached
   * our predicted minimum idle time and try again
   *
   * waitFor: wait for at least this amount of ms before checking idleness
   */
  private schedule(waitFor: number) {
    setTimeout(
      () => {
        if (!this.running) return;
        if (this.currentIdleTime >= this.minIdleMiliseconds) {
          const doNext = this.task();
          if (doNext) {
            this.schedule(0);
          } else {
            this.schedule(this.minIdleMiliseconds);
          }
        } else {
          this.schedule(this.minIdleMiliseconds - this.currentIdleTime);
        }
      },
      waitFor < 0 ? 0 : waitFor
    );
  }

  notIdle() {
    this.idleSince = Date.now();
  }
  stop() {
    this.running = false;
  }
}
