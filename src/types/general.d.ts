/// <reference types="deck.gl" />
import { Layer } from '@deck.gl/core';
export declare type Nullable<T> = T | null;
export declare type UUID = string;
export declare type ProgressEvent = {
    lengthComputable: boolean;
    loaded: number;
    total: number;
};
export declare type LayerConstructor<T, P = unknown> = {
    new (props: P): Layer<T>;
    layerName: string;
};
