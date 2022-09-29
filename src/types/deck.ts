import { Layer } from '@deck.gl/core';
import { PickInfo } from '@deck.gl/core/lib/deck';

export type DeckEvent = 'click' | 'error';

export interface DeckEventCallback {
  (opts: DeckEventPayload): void;
}

export interface DeckEventPayload {
  pickInfo?: PickInfo<unknown>;
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
