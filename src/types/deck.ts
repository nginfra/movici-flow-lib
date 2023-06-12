import type { Layer } from "@deck.gl/core";
import type { PickInfo } from "deck.gl";
import type { DeckEntityObject } from "./datasets";

export type DeckEvent = "click" | "error";

export interface DeckEventCallback<D = unknown> {
  (opts: DeckEventPayload<D>): void;
}

export interface DeckEventPayload<D = unknown> {
  pickInfo?: PickInfo<DeckEntityObject<D>>;
  ev?: DeckMouseEvent;
  error?: Error;
  layer?: Layer<unknown>;
}

export type DeckMouseEvent = {
  leftButton: boolean;
  centerButton: boolean;
  rightButton: boolean;
  type: string;
};
