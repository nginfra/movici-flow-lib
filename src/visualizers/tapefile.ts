import { range } from 'lodash';
import {
  ComponentProperty,
  EntityGroupData,
  EntityGroupSpecialValues,
  EntityUpdate,
  ITapefile
} from '../types';
export interface TapefileUpdate<T> {
  timestamp: number;
  length: number;
  indices: number[];
  data: T[];
  rollback?: T[];
  fullRollback?: boolean;
}

export class TapefileWriter<T> {
  index: Index;
  tapefile: SinglePropertyTapefile<T>;
  attribute: string;
  constructor(index: Index, tapefile: SinglePropertyTapefile<T>, attribute: string) {
    this.index = index;
    this.tapefile = tapefile;
    this.attribute = attribute;
  }
  initializeTapefile() {
    const length = this.tapefile.state.length;
    this.tapefile.updates = [
      {
        length,
        timestamp: 0,
        indices: range(length),
        data: getEmptyArray(length)
      }
    ];
  }
  /**
   * Add an update to the tapefile, assuming it comes after the last update in the tapefile
   * If the timestamp is larger than the last update, just prepare and add it, if the timestamp
   * is the same, merge it with the last update before overwriting
   */
  appendUpdate(update: { timestamp: number; data: EntityGroupData<T> }) {
    let parsed = this.prepareUpdate(update);
    const updates = this.tapefile.updates;
    if (parsed === null) return;
    const lastUpdate = updates[updates.length - 1];
    if (lastUpdate && update.timestamp < lastUpdate.timestamp) {
      throw new Error('Cannot append updates that have a lower timestamp than current latest');
    }

    if (update.timestamp === lastUpdate?.timestamp) {
      parsed = this.mergeUpdates(lastUpdate, parsed);
      updates[updates.length - 1] = parsed;
    } else {
      updates.push(parsed);
    }
  }

  private prepareUpdate(update: {
    timestamp: number;
    data: EntityGroupData<T>;
  }): TapefileUpdate<T> | null {
    let dataArray = this.getDataArray(update.data);
    let idArray = update.data.id || [];
    if (dataArray.length !== idArray.length) {
      return null;
    }

    // filter out nulls
    const dataIndices: number[] = [];
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] !== null) {
        dataIndices.push(i);
      }
    }

    if (dataIndices.length !== dataArray.length) {
      dataArray = getDataForIndices(dataArray, dataIndices);
      idArray = getDataForIndices(idArray, dataIndices);
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
  private getDataArray(data: EntityGroupData<T>): T[] {
    const result = data[this.attribute] ?? [];
    if (!Array.isArray(result)) {
      // todo: remove when components are fully removed
      throw new Error('Cannot deal with components');
    }
    return result;
  }
  private mergeUpdates<T>(first: TapefileUpdate<T>, second: TapefileUpdate<T>) {
    const updateMap: Map<number, T> = new Map();
    function applyUpdate(upd: TapefileUpdate<T>) {
      for (let i = 0; i < upd.length; i++) {
        updateMap.set(upd.indices[i], upd.data[i]);
      }
    }
    applyUpdate(first);
    applyUpdate(second);
    const rv: TapefileUpdate<T> = {
      timestamp: first.timestamp,
      length: updateMap.size,
      data: new Array(updateMap.size),
      indices: new Array(updateMap.size)
    };
    if (first.fullRollback) {
      rv.rollback = first.rollback;
      rv.fullRollback = true;
    }

    let idx = 0;
    for (const [key, value] of updateMap) {
      rv.indices[idx] = key;
      rv.data[idx] = value;
      idx++;
    }
    return rv;
  }
}

export abstract class BaseTapefile<T> implements ITapefile<T> {
  specialValue?: T;
  specialValuesCallbacks: ((val: unknown) => void)[];
  abstract data: T[];

  constructor({ specialValue }: { specialValue?: T }) {
    this.specialValue = specialValue;
    this.specialValuesCallbacks = [];
  }
  onSpecialValue(cb: (val: unknown) => void) {
    this.specialValuesCallbacks.push(cb);
  }

  setSpecialValue(val: T) {
    this.specialValue = val;
    for (const cb of this.specialValuesCallbacks) {
      cb(val);
    }
  }
  abstract moveTo(time: number): void;
  abstract copyState(): T[];
}
/**
 * A SinglePropertyTapefile can be used to calculate the state of a specific attribute in an entity
 * group at a specific timestamp in a scenario. It needs a single update (or init data) to start
 * with but more updates can be added incrementally. It can lazily evaluate rollbacks for these
 * updates, although for the best performance it is important to periodically `trimRollbacks`
 *
 * The general usage of this class is to first move the
 * tape to a specific timestamp using `SinglePropertyTapefile.moveTo()` and then requesting the
 * state with `SinglePropertyTapefile.getState()`
 */
export class SinglePropertyTapefile<T> extends BaseTapefile<T> {
  componentProperty: ComponentProperty;
  state: PropertyState<T>;
  updates: TapefileUpdate<T>[];
  currentUpdateIdx: number | null;

  private trimmedUntil: number;
  private lastRollback: number;
  constructor({
    componentProperty,
    length,
    updates,
    specialValue
  }: {
    componentProperty: ComponentProperty;
    length: number;
    updates?: TapefileUpdate<T>[];
    specialValue?: T;
  }) {
    super({ specialValue });
    this.componentProperty = componentProperty;
    this.state = new PropertyState(length);
    this.updates = updates ?? [];
    this.currentUpdateIdx = null;

    if (this.updates?.length) {
      this.state.applyUpdate(this.updates[0]);
      this.currentUpdateIdx = 0;
    }

    this.trimmedUntil = 0;
    this.lastRollback = 0; // the first update does not need a rollback
  }

  get numberOfEntities() {
    return this.state.length;
  }

  get data() {
    return this.state.data;
  }

  get currentTime() {
    return this.currentUpdateIdx === null ? null : this.updates[this.currentUpdateIdx].timestamp;
  }
  get minTime() {
    return this.updates[0]?.timestamp ?? -1;
  }
  get maxTime() {
    return this.updates[this.updates.length - 1].timestamp ?? -1;
  }
  get nextTime() {
    if (this.currentUpdateIdx === null || this.currentUpdateIdx === this.updates.length - 1) {
      return Infinity;
    }
    return this.updates[this.currentUpdateIdx + 1].timestamp;
  }
  copyState() {
    return this.state.copyState();
  }
  moveTo(time: number) {
    let currentTime = this.currentTime;
    if (currentTime === null) {
      if (!this.updates.length) return;
      this.currentUpdateIdx = 0;
      const newUpdate = this.updates[this.currentUpdateIdx];
      this.state.applyUpdate(newUpdate);
      currentTime = newUpdate.timestamp;
    }
    if (time === currentTime) return;
    if (time > currentTime) {
      return this.moveForward(time);
    }
    if (time < currentTime) {
      return this.moveBackward(time);
    }
  }

  private moveForward(time: number) {
    time = Math.min(time, this.maxTime);
    while (time >= this.nextTime) {
      this.stepForward();
    }
  }
  private moveBackward(time: number) {
    time = Math.max(time, this.minTime);
    if (this.currentTime === null) return;
    while (time < this.currentTime) {
      this.stepBackward();
    }
  }

  stepForward() {
    if (this.currentUpdateIdx === null || this.currentUpdateIdx >= this.updates.length - 1) {
      throw RangeError('Requested step out of bounds');
    }
    this.currentUpdateIdx++;
    const newUpdate = this.updates[this.currentUpdateIdx];
    // In case we there is no rollback calculated for the newUpdate yet, we need to calculate it
    // just before we apply it, otherwise we cannot later undo (ie rollback) the newUpdate.
    this.calculateRollback(newUpdate, this.currentUpdateIdx === this.updates.length - 1);
    this.state.applyUpdate(newUpdate);
  }

  stepBackward() {
    if (this.currentUpdateIdx === null || this.currentUpdateIdx === 0) {
      throw new RangeError('Requested step out of bounds');
    }
    const currentUpdate = this.updates[this.currentUpdateIdx];
    this.state.rollbackUpdate(currentUpdate);

    this.currentUpdateIdx--;
  }
  calculateNextRollback() {
    if (!this.updates.length) return false;
    const lastRollback = this.lastRollback,
      nextRollback = lastRollback + 1,
      updates = this.updates,
      lastUpdate = updates.length - 1,
      isLast = nextRollback === lastUpdate;
    if (nextRollback > lastUpdate) return false;
    this.moveTo(updates[lastRollback].timestamp);
    this.calculateRollback(updates[nextRollback], isLast);
    this.lastRollback = nextRollback;
    this.trimRollbacks();

    return !isLast;
  }

  private calculateRollback(update: TapefileUpdate<T>, isLast: boolean) {
    if (update.rollback) return;
    if (isLast) {
      // the update currently last in the list of updates gets a special treatment. In certain
      // cases this update may be merged with new updates coming along, which can change (increase)
      // the number of indices in the update, which would invalidate its rollback. By taking the
      // full state of the attribute, we use a little more memory, but we are sure to always have a
      // valid rollback. In a different part of the code (eg. `TapefileWriter`) we can trim the
      // rollback whenever the affected update is no longer last in the list
      update.rollback = this.state.copyState();

      update.fullRollback = true;
    } else {
      update.rollback = getDataForIndices(this.state.data, update.indices);
      update.fullRollback = false;
    }
  }

  trimRollbacks() {
    if (this.updates.length < 2) return;

    // start at the second to last update, always leave the last rollback in tact
    let i = this.updates.length - 2;

    while (i >= this.trimmedUntil) {
      const upd = this.updates[i];
      if (hasFullRollback(upd)) {
        upd.rollback = getDataForIndices(upd.rollback, upd.indices);
        upd.fullRollback = false;
      }
      i--;
    }
    this.trimmedUntil = this.updates.length - 1;
  }
}
function hasFullRollback<T>(
  upd: TapefileUpdate<T>
): upd is TapefileUpdate<T> & { hasFullRollback: true; rollback: T[] } {
  return (upd.rollback && upd.fullRollback) ?? false;
}
export class Index {
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

  applyUpdate(update: TapefileUpdate<T>) {
    return this.setUpdateData(update.indices, update.data);
  }

  rollbackUpdate(update: TapefileUpdate<T>) {
    if (hasFullRollback(update)) {
      this.setFullState(update.rollback);
    } else if (update.rollback) {
      return this.setUpdateData(update.indices, update.rollback);
    } else {
      throw new Error('Update has no rollback');
    }
  }
  private setFullState(data: T[]) {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = data[i];
    }
  }
  private setUpdateData(indices: number[], data: T[]) {
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

function getDataForIndices<T>(data: Array<T>, indices: number[]) {
  const rv: T[] = new Array(indices.length);
  for (let i = 0; i < indices.length; i++) {
    rv[i] = data[indices[i]];
  }
  return rv;
}

/**
 * This function is now a only used in testing as a helper function to create tapefiles
 */
export function createTapefileFromStateAndUpdates<T>(
  componentProperty: ComponentProperty,
  initialState: EntityGroupData<T>,
  updates: EntityUpdate<T>[],
  specialValues?: EntityGroupSpecialValues<T>
) {
  const specialValue = specialValues?.[componentProperty.name],
    index = new Index(initialState.id),
    tapefile = new SinglePropertyTapefile({
      componentProperty,
      length: index.length,
      specialValue
    }),
    writer = new TapefileWriter(index, tapefile, componentProperty.name);
  writer.appendUpdate({
    timestamp: -1,
    data: initialState
  });
  tapefile.calculateNextRollback();
  for (const update of updates) {
    writer.appendUpdate(update);
    tapefile.calculateNextRollback();
  }
  tapefile.trimRollbacks();
  tapefile.moveTo(0);
  return tapefile;
}
