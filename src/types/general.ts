import { Layer } from '@deck.gl/core';

export type Nullable<T> = T | null;
export type UUID = string;
export type ProgressEvent = { lengthComputable: boolean; loaded: number; total: number };

export type LayerConstructor<T, P = unknown> = { new (props: P): Layer<T>; layerName: string };
