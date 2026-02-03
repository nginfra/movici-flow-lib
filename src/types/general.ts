import type { Layer } from "@deck.gl/core";

export type Nullable<T> = T | null;
export type UUID = string;
export type ProgressEvent = { lengthComputable: boolean; loaded: number; total: number };

/* eslint-disable-next-line @typescript-eslint/no-empty-object-type */
export type LayerConstructor<P extends {} = {}> = {
  readonly prototype: Layer<P>;
  new (props: P): Layer<P>;
  layerName: string;
  defaultProps?: Partial<P>;
};

export type ArrayValues<
  T extends Record<K, V>,
  K extends string | number | symbol = keyof T,
  V = T[K],
> = {
  [k in K]: V[];
};
