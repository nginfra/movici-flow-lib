import type {
  DataAttribute,
  EntityGroupData,
  EntityGroupSpecialValues,
  Update,
  UpdateWithData,
  UUID,
} from "@movici-flow-lib/types";
import type { DatasetDownloader } from "@movici-flow-lib/utils/DatasetDownloader";
import EventHandler from "@movici-flow-lib/utils/EventHandler";
import { PriorityQueue } from "@movici-flow-lib/utils/queue";
import type StatusTracker from "@movici-flow-lib/utils/StatusTracker";
import { Index, StreamingTapefile } from "./tapefile";
import type { ITaskDispatcher, PrioritizedTask, Task } from "./tasks";
import { BatchedTaskDispatcher } from "./tasks";
interface TapefileStoreConfig {
  onData?: (ts: number) => void;
  onReady?: () => void;
}

export class TapefileStore {
  // keys in TapefileStore.tapefiles are `datasetUUID:entityGroup:attribute`. See also
  // `TapefileStore.ensureTapefile`
  private tapefiles: Record<string, StreamingTapefile<unknown>>;
  private statusTrackers: Map<StreamingTapefile<unknown>, [number, StatusTracker][]>;
  private currentProgress: Map<StreamingTapefile<unknown>, Record<string, number>>;
  private onDataCallback?: (timestamp: number) => void;
  private tasks: ITaskDispatcher<Task<unknown>>;
  constructor(config?: TapefileStoreConfig) {
    this.tapefiles = {};
    this.tasks = new BatchedTaskDispatcher({
      BATCH_SIZE: 20,
      queue: new PriorityQueue<PrioritizedTask<unknown>>((a, b) => a.priority - b.priority),
      onReady: () => {
        config?.onReady?.();
        this.startIdleTasks();
      },
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
  getTapefile<T>(params: {
    entityGroup: string;
    attributes: DataAttribute[];
    store: DatasetDownloader;
    status?: StatusTracker;
  }): StreamingTapefile<T> {
    return this.getTapefiles<T>(params)[0];
  }
  getTapefiles<T>({
    entityGroup,
    attributes,
    store,
    status,
  }: {
    entityGroup: string;
    attributes: DataAttribute[];
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
        },
      }).then((tasks) => {
        tasks.forEach((t) => this.tasks.push(t));
      });
      for (const tapefile of newTapefiles) {
        this.currentProgress.set(tapefile, { initData: 0, updates: 0 });
      }
    }
    if (status) {
      for (const tf of tapefiles) {
        const id = status.register(["initData", "updates"]);
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
  onProgress,
}: {
  entityGroup: string;
  tapefiles: StreamingTapefile<unknown>[];
  store: DatasetDownloader;
  onError?: (err: unknown, task: string) => void;
  onProgress?: (val: number, task: string) => void;
}): Promise<PrioritizedTask<unknown>[]> {
  const tasks: PrioritizedTask<unknown>[] = [];
  const attributes: DataAttribute[] = tapefiles.map((t) => {
    return { name: t.attribute, component: null };
  });
  tasks.push(
    getInitDataTask({
      store,
      entityGroup,
      attributes,
      tapefiles,
      onError: (err: unknown) => onError?.(err, "initData"),
      onDone: () => onProgress?.(100, "initData"),
    })
  );
  const updates = await store.getUpdateList(),
    total = updates.length;
  if (!total) {
    onProgress?.(100, "updates");
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
        onError: (err: unknown) => onError?.(err, "updates"),
        onDone: () => {
          onProgress?.((++tasksDone / total) * 100, "updates");
        },
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
  onDone,
}: {
  store: DatasetDownloader;
  entityGroup: string;
  attributes: DataAttribute[];
  tapefiles: StreamingTapefile<unknown>[];
  onError?: (err: unknown) => void;
  onDone?: () => void;
}): PrioritizedTask<[EntityGroupData<unknown>, EntityGroupSpecialValues]> {
  return {
    getTask() {
      return Promise.all([
        store.getInitialData<EntityGroupData<unknown>>({
          entityGroup,
          properties: attributes,
        }),
        store.getSpecialValues(entityGroup),
      ]);
    },
    onDone([initialData, specialValues]: [EntityGroupData<unknown>, EntityGroupSpecialValues]) {
      const index = new Index(initialData.id);
      for (const tapefile of tapefiles) {
        tapefile.initialize({
          index,
          initialData,
        });
        tapefile.setSpecialValue(specialValues[tapefile.attribute]);
      }
      onDone?.();
    },
    onError(err: unknown) {
      onError ? onError(err) : console.error(err);
      onDone?.();
    },
    priority: -1,
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
  onDone,
}: {
  update: Update;
  sequenceNumber: number;
  store: DatasetDownloader;
  entityGroup: string;
  attributes: DataAttribute[];
  tapefiles: StreamingTapefile<unknown>[];
  onError?: (err: unknown) => void;
  onDone?: () => void;
}) {
  return {
    getTask() {
      return store.getUpdateData(update, entityGroup, attributes);
    },
    onDone(upd: UpdateWithData) {
      const data = upd?.data[entityGroup] ?? {};
      for (const tapefile of tapefiles) {
        tapefile.addUpdate(
          {
            timestamp: upd.timestamp,
            iteration: upd.iteration,
            data,
          },
          sequenceNumber
        );
      }
      onDone?.();
    },
    onError(err: unknown) {
      onError ? onError(err) : console.error(err);
      onDone?.();
    },
    priority: update.timestamp,
  };
}

export class TapefileStoreCollection extends EventHandler<"data" | "ready", number> {
  private tapefileStores: Record<UUID, TapefileStore>;
  constructor() {
    super();
    this.tapefileStores = {};
  }
  ensure(scenarioUUID?: UUID | null): TapefileStore {
    scenarioUUID = scenarioUUID ?? "";
    this.tapefileStores[scenarioUUID] ??= new TapefileStore({
      onData: (ts: number) => this.invokeCallbacks("data", ts),
      onReady: () => this.invokeCallbacks("ready", Number.MAX_SAFE_INTEGER),
    });
    return this.tapefileStores[scenarioUUID];
  }
  get(scenarioUUID: UUID): TapefileStore | null {
    return this.tapefileStores[scenarioUUID] ?? null;
  }
}
