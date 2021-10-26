import {
  ComponentData,
  ComponentProperty,
  EntityGroupData,
  EntityUpdate,
  ITapefile
} from '@/flow/types';
import { TimelineDownloader } from '@/flow/utils/timeline';
import { DatasetDownloader } from '@/flow/utils/DatasetDownloader';
import { VisualizerInfo } from '@/flow/visualizers/VisualizerInfo';

interface TapefileUpdate<T> {
  timestamp: number;
  length: number;
  indices: number[];
  data: T[];
  rollback?: T[];
}

function getEmptyUpdate(timestamp: number): TapefileUpdate<never> {
  return {
    timestamp,
    length: 0,
    indices: [],
    data: []
  };
}

export async function layerInfoToTapefile<T>(
  layerInfo: VisualizerInfo,
  property: ComponentProperty,
  store: DatasetDownloader
): Promise<SinglePropertyTapefile<T>> {
  if (!layerInfo.scenarioUUID) {
    throw new Error('Missing scenarioUUID');
  }
  return (
    await getTapefiles<T>({
      store,
      entityGroup: layerInfo.entityGroup,
      properties: [property]
    })
  )[0];
}

export async function getTapefiles<T>(config: {
  store: DatasetDownloader;
  entityGroup: string;
  properties: ComponentProperty[];
}): Promise<SinglePropertyTapefile<T>[]> {
  const initialData = await config.store.getInitialData<EntityGroupData<T>>({
    entityGroup: config.entityGroup,
    properties: config.properties
  });

  const updates = await new TimelineDownloader(
    config.entityGroup,
    config.properties,
    config.store
  ).download<T>();
  return config.properties.map(p => createTapefileFromStateAndUpdates(p, initialData, updates));
}

export function createTapefileFromStateAndUpdates<T>(
  componentProperty: ComponentProperty,
  initialState: EntityGroupData<T>,
  updates: EntityUpdate<T>[]
) {
  const builder = new TapefileBuilder(componentProperty, initialState);
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    builder.addUpdate(update);
  }
  return builder.createTapefile();
}

export function mergeUpdates<T>(first: TapefileUpdate<T>, second: TapefileUpdate<T>) {
  const updateMap = new Map();
  function applyUpdate<T>(upd: TapefileUpdate<T>) {
    for (let i = 0; i < upd.length; i++) {
      updateMap.set(upd.indices[i], upd.data[i]);
    }
  }
  applyUpdate(first);
  applyUpdate(second);
  const rv = {
    timestamp: first.timestamp,
    length: updateMap.size,
    data: new Array(updateMap.size),
    indices: new Array(updateMap.size)
  };
  let idx = 0;
  for (const [key, value] of updateMap) {
    rv.indices[idx] = key;
    rv.data[idx] = value;
    idx++;
  }
  return rv;
}
/**
 * Creates a SinglePropertyTapefile for a specific ComponentProperty based on `initialState` data
 * and subsequent updates given through `TapefileBuilder.addUpdate`.
 * `initialState` must be EntityGroupData that at least has the `id` field with all entities
 * present. For the `initialState` and subsequent given updates, the `TapefileBuilder` looks up the
 * data array of the `ComponentProperty` and adds that data as an update to a
 * `SinglePropertyTapefile` at the correct timestamp. It also calculates a rollback update to be
 * able to move the tapefile back in time. If there are multiple updates of a property at the
 * same timestamp, these are merged into a single update.
 */
export class TapefileBuilder<T> {
  updates: TapefileUpdate<T>[];
  componentProperty: ComponentProperty;
  index: Index;
  state: PropertyState<T>;
  currentTime: number;
  currentIteration: number;
  isFinal: boolean;
  constructor(componentProperty: ComponentProperty, inititalState: EntityGroupData<T>) {
    this.updates = [];
    this.componentProperty = componentProperty;
    this.index = new Index(inititalState.id);
    this.state = new PropertyState(inititalState.id.length);
    this.currentTime = 0;
    this.currentIteration = -2; // No state yet so the initial data at iteration -1 is accepted
    this.isFinal = false;
    this.addUpdate({ timestamp: 0, iteration: -1, data: inititalState });
  }

  /**
   * adds an update to the Tapefile. Updates must be added in increasing
   * iteration number. Updates may only be added while the TapefileBuilder
   * is not finalized.
   */
  addUpdate(update: EntityUpdate<T>) {
    if (this.isFinal) {
      throw Error('Can only add updates while not finalized');
    }

    if (this.updates.length === 0) {
      return this.addInitialUpdate(update);
    }

    // Now we're sure there's at least one update (with our property array) in the
    // list so things like rollback and pop work

    if (update.iteration <= this.currentIteration) {
      throw Error('Can only accept updates in increasing iteration number');
    }

    let parsed = this.prepareUpdate(update);
    if (!parsed) {
      return;
    }
    // We have new update data

    if (update.timestamp === this.currentTime) {
      // merge update with last applied update
      const lastUpdate = this.updates.pop() as TapefileUpdate<T>;
      this.state.rollbackUpdate(lastUpdate);
      parsed = mergeUpdates(lastUpdate, parsed);
    }

    // We now have one update per timestamp
    parsed.rollback = this.calculateRollback(parsed);
    this.state.applyUpdate(parsed);
    this.updates.push(parsed);
    this.currentTime = update.timestamp;
    this.currentIteration = update.iteration;
  }

  addInitialUpdate(update: { timestamp: number; iteration: number; data: EntityGroupData<T> }) {
    const parsed = this.prepareUpdate(update) || getEmptyUpdate(update.timestamp);

    parsed.rollback = this.calculateRollback(parsed);
    this.state.applyUpdate(parsed);
    this.updates.push(parsed);

    this.currentTime = update.timestamp;
    this.currentIteration = update.iteration;
  }

  prepareUpdate(update: {
    timestamp: number;
    iteration: number;
    data: EntityGroupData<T>;
  }): TapefileUpdate<T> | null {
    let dataArray = this.getDataArray(update.data);
    let idArray = update.data.id || [];
    if (dataArray.length !== idArray.length) {
      return null;
    }

    // filter out nulls
    const nullIndices = new Set();
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] === null) {
        nullIndices.add(i);
      }
    }

    if (nullIndices.size) {
      dataArray = dataArray.filter((_, idx) => !nullIndices.has(idx));
      idArray = idArray.filter((_, idx) => !nullIndices.has(idx));
    }

    if (!dataArray.length) {
      return null;
    }

    const indices = this.index.getArray(idArray);
    return {
      timestamp: update.timestamp,
      length: dataArray.length,
      indices,
      data: dataArray
    };
  }

  calculateRollback(update: TapefileUpdate<T>) {
    return this.state.getDataForIndices(update.indices);
  }

  getDataArray(data: EntityGroupData<T>): T[] {
    if (this.componentProperty.component) {
      const component = data[this.componentProperty.component] as ComponentData<T>;
      return component ? component[this.componentProperty.name] || [] : [];
    }

    return (data[this.componentProperty.name] || []) as T[];
  }

  createTapefile() {
    this.isFinal = true;
    return new SinglePropertyTapefile(this.componentProperty, this.index.length, this.updates);
  }
}

/**
 * A SinglePropertyTapefile can be used to calculate the state of a specific attribute in an entity
 * group at a specific timestamp in a scenario. It is configured with all updates (including the
 * initial data) and their rollbacks. The general usage of this class is to first move the tape to
 * a specific timestamp using `SinglePropertyTapefile.moveTo()` and then requesting the state with
 * `SinglePropertyTapefile.getState()`
 */
export class SinglePropertyTapefile<T> implements ITapefile<T> {
  componentProperty: ComponentProperty;
  state: PropertyState<T>;
  updates: TapefileUpdate<T>[];
  currentUpdateIdx: number;
  minTime: number;
  maxTime: number;

  constructor(componentProperty: ComponentProperty, length: number, updates: TapefileUpdate<T>[]) {
    this.componentProperty = componentProperty;
    this.state = new PropertyState(length);
    this.state.applyUpdate(updates[0]);
    this.updates = updates;
    this.currentUpdateIdx = 0;
    this.minTime = this.currentTime;
    this.maxTime = updates[updates.length - 1].timestamp;
  }

  get numberOfEntities() {
    return this.state.length;
  }

  get data() {
    return this.state.data;
  }

  copyState() {
    return this.state.copyState();
  }
  get currentTime() {
    return this.updates[this.currentUpdateIdx].timestamp;
  }

  get nextTime() {
    if (this.currentUpdateIdx === this.updates.length - 1) return Infinity;
    return this.updates[this.currentUpdateIdx + 1].timestamp;
  }

  moveTo(time: number) {
    if (time === this.currentTime) return;
    if (time > this.currentTime) {
      return this.moveForward(Math.min(time, this.maxTime));
    }
    if (time < this.currentTime) {
      return this.moveBackward(Math.max(time, this.minTime));
    }
  }

  moveForward(time: number) {
    while (time >= this.nextTime) {
      this.stepForward();
    }
  }

  moveBackward(time: number) {
    while (time < this.currentTime) {
      this.stepBackward();
    }
  }

  stepForward() {
    if (this.currentUpdateIdx >= this.updates.length - 1) {
      throw RangeError('Requested step out of bounds');
    }
    this.currentUpdateIdx++;
    const newUpdate = this.updates[this.currentUpdateIdx];
    this.state.applyUpdate(newUpdate);
  }

  stepBackward() {
    if (this.currentUpdateIdx === 0) {
      throw new RangeError('Requested step out of bounds');
    }
    const currentUpdate = this.updates[this.currentUpdateIdx];
    this.state.rollbackUpdate(currentUpdate);
    this.currentUpdateIdx--;
  }
}

class Index {
  map: Map<number, number>;
  length: number;
  constructor(idArray: number[]) {
    this.map = new Map();
    for (let i = 0; i < idArray.length; i++) {
      this.map.set(idArray[i], i);
    }
    this.length = idArray.length;
  }

  get(id: number) {
    return this.map.get(id);
  }

  getArray(ids: number[]): number[] {
    const rv = new Array(ids.length);
    for (let i = 0; i < ids.length; i++) {
      rv[i] = this.get(ids[i]);
    }
    return rv;
  }
}
class PropertyState<T> {
  length: number;
  data: T[];
  constructor(length: number) {
    this.length = length;
    this.data = getEmptyArray(length);
  }

  getDataForIndices(indices: number[]) {
    const rv = new Array(indices.length);
    for (let i = 0; i < indices.length; i++) {
      rv[i] = this.data[indices[i]];
    }
    return rv;
  }

  applyUpdate(update: TapefileUpdate<T>) {
    return this.setUpdateData(update.indices, update.data);
  }

  rollbackUpdate(update: TapefileUpdate<T>) {
    if (update.rollback) {
      return this.setUpdateData(update.indices, update.rollback);
    }
  }

  setUpdateData(indices: number[], data: T[]) {
    for (let i = 0; i < indices.length; i++) {
      this.data[indices[i]] = data[i];
    }
  }

  copyState() {
    return [...this.data];
  }
}
function getEmptyArray(size: number) {
  return new Array(size).fill(null);
}
