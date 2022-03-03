export enum MovActionType {
  ADD = 'add',
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  DUPLICATE = 'duplicate',
  DOWNLOAD = 'download',
  GENERATE = 'generate',
  PLAY = 'play',
  RESET = 'reset',
  CANCEL = 'cancel',
  INVITE = 'invite',
  LOGS = 'logs'
}

export interface ActionItem {
  icon?: string;
  iconPack?: string;
  label: string;
  event: string;
  colorScheme?: string;
  isDisabled?: boolean;
}

export type ButtonItem = ActionItem;
export type ActionMenuItem = ActionItem;
