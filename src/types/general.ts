import { Layer } from '@deck.gl/core';

export type Nullable<T> = T | null;
export type UUID = string;
export type ProgressEvent = { lengthComputable: boolean; loaded: number; total: number };

export type LayerConstructor<T, P = unknown> = {
  readonly prototype: Layer<T>;
  new (props: P): Layer<T>;
  layerName: string;
  defaultProps?: Partial<P>;
};

export type ArrayValues<
  T extends Record<K, V>,
  K extends string | number | symbol = keyof T,
  V = T[K]
> = {
  [k in K]: V[];
};
