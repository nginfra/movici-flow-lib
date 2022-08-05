import { PickInfo } from 'deck.gl';
import { PropertyType } from './schema';
import { ITapefile } from './visualization';

export type PopupType = 'onClick' | 'onHover';

export type PopupPosition = 'map' | 'right-side';

export type DeckMouseEvent = {
  leftButton: boolean;
  centerButton: boolean;
  rightButton: boolean;
  type: string;
};

export interface PopupItem {
  name: string;
  attribute: PropertyType;
}

export interface PopupContent<D = unknown> {
  title: string;
  dynamicTitle?: boolean;
  pickInfo: PickInfo<D>;
  index: number;
  items: PopupContentItem[];
}

export interface PopupContentItem extends PopupItem {
  tapefile: ITapefile<unknown>;
  enum?: string[];
}

export type PopupSettings = {
  layerId: string;
  visible: boolean;
  type: PopupType;
  position: PopupPosition;
  content: PopupContent;
  highlighted: PopupType | null;
};

export type PopupEventCallback = (content: PopupContent | null, ev?: DeckMouseEvent) => void;

export type PickingHandler<D> = (info: PickInfo<D>, ev?: DeckMouseEvent) => boolean;
