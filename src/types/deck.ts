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

export interface DeckMouseEvent {
  leftButton: boolean;
  centerButton: boolean;
  rightButton: boolean;
  type: string;
}
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
  minZoom?: number;
  maxZoom?: number;
}
export interface DeckCamera {
  viewState?: ViewState;
  bbox?: {
    coords: [number, number, number, number];
    fillRatio?: number;
  };
}
