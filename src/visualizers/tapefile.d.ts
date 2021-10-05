import { ComponentProperty, EntityGroupData, EntityUpdate, ITapefile } from '@/types';
import { DatasetDownloader } from '@//utils/DatasetDownloader';
import { VisualizerInfo } from '@/visualizers/VisualizerInfo';
interface TapefileUpdate<T> {
    timestamp: number;
    length: number;
    indices: number[];
    data: T[];
    rollback?: T[];
}
export declare function layerInfoToTapefile<T>(layerInfo: VisualizerInfo, property: ComponentProperty, store: DatasetDownloader): Promise<SinglePropertyTapefile<T>>;
export declare function getTapefiles<T>(config: {
    store: DatasetDownloader;
    entityGroup: string;
    properties: ComponentProperty[];
}): Promise<SinglePropertyTapefile<T>[]>;
export declare function createTapefileFromStateAndUpdates<T>(componentProperty: ComponentProperty, initialState: EntityGroupData<T>, updates: EntityUpdate<T>[]): SinglePropertyTapefile<T>;
export declare function mergeUpdates<T>(first: TapefileUpdate<T>, second: TapefileUpdate<T>): {
    timestamp: number;
    length: number;
    data: any[];
    indices: any[];
};
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
export declare class TapefileBuilder<T> {
    updates: TapefileUpdate<T>[];
    componentProperty: ComponentProperty;
    index: Index;
    state: PropertyState<T>;
    currentTime: number;
    currentIteration: number;
    isFinal: boolean;
    constructor(componentProperty: ComponentProperty, inititalState: EntityGroupData<T>);
    /**
     * adds an update to the Tapefile. Updates must be added in increasing
     * iteration number. Updates may only be added while the TapefileBuilder
     * is not finalized.
     */
    addUpdate(update: EntityUpdate<T>): void;
    addInitialUpdate(update: {
        timestamp: number;
        iteration: number;
        data: EntityGroupData<T>;
    }): void;
    prepareUpdate(update: {
        timestamp: number;
        iteration: number;
        data: EntityGroupData<T>;
    }): TapefileUpdate<T> | null;
    calculateRollback(update: TapefileUpdate<T>): any[];
    getDataArray(data: EntityGroupData<T>): T[];
    createTapefile(): SinglePropertyTapefile<T>;
}
/**
 * A SinglePropertyTapefile can be used to calculate the state of a specific attribute in an entity
 * group at a specific timestamp in a scenario. It is configured with all updates (including the
 * initial data) and their rollbacks. The general usage of this class is to first move the tape to
 * a specific timestamp using `SinglePropertyTapefile.moveTo()` and then requesting the state with
 * `SinglePropertyTapefile.getState()`
 */
export declare class SinglePropertyTapefile<T> implements ITapefile<T> {
    componentProperty: ComponentProperty;
    state: PropertyState<T>;
    updates: TapefileUpdate<T>[];
    currentUpdateIdx: number;
    minTime: number;
    maxTime: number;
    constructor(componentProperty: ComponentProperty, length: number, updates: TapefileUpdate<T>[]);
    get numberOfEntities(): number;
    get data(): T[];
    copyState(): T[];
    get currentTime(): number;
    get nextTime(): number;
    moveTo(time: number): void;
    moveForward(time: number): void;
    moveBackward(time: number): void;
    stepForward(): void;
    stepBackward(): void;
}
declare class Index {
    map: Map<number, number>;
    length: number;
    constructor(idArray: number[]);
    get(id: number): number | undefined;
    getArray(ids: number[]): number[];
}
declare class PropertyState<T> {
    length: number;
    data: T[];
    constructor(length: number);
    getDataForIndices(indices: number[]): any[];
    applyUpdate(update: TapefileUpdate<T>): void;
    rollbackUpdate(update: TapefileUpdate<T>): void;
    setUpdateData(indices: number[], data: T[]): void;
    copyState(): T[];
}
export {};
