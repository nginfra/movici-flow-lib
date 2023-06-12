import type { PickInfo } from "deck.gl";
import type { DeckMouseEvent } from "./deck";
import type { AttributeType } from "./schema";
import type { ITapefile } from "./visualization";

export interface PopupItem {
  name: string;
  attribute: AttributeType;
}

export interface PopupContent<D = unknown> {
  title: string;
  dynamicTitle?: boolean;
  pickInfo: PickInfo<D>;
  entityIndex: number;
  items: PopupContentItem[];
}

export interface PopupContentItem extends PopupItem {
  tapefile: ITapefile<unknown>;
  enum?: string[];
}

export type PopupKind = "map-hover" | "map-persistent" | "right-side";
export type PopupAccent = "strong" | "weak";

export type PopupInfo<D = unknown> = {
  layerId: string;
  kind: PopupKind;
  content: PopupContent<D>;
  accent?: PopupAccent | null;
};

export type PopupEventCallback = (content: PopupContent | null, ev?: DeckMouseEvent) => void;

export type PickingHandler<D> = (info: PickInfo<D>, ev?: DeckMouseEvent) => boolean;
