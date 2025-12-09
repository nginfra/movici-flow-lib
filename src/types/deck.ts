import type { Layer } from "@deck.gl/core";
import type { PickingInfo } from "@deck.gl/core";
import type { DeckEntityObject } from "./datasets";

export type DeckEvent = "click" | "error";

export interface DeckEventCallback<D = unknown> {
  (opts: DeckEventPayload<D>): void;
}

export interface DeckEventPayload<D = unknown> {
  pickInfo?: PickingInfo<DeckEntityObject<D>>;
  ev?: DeckMouseEvent;
  error?: Error;
  layer?: Layer;
}

export type DeckMouseEvent = {
  leftButton: boolean;
  centerButton: boolean;
  rightButton: boolean;
  type: string;
};
