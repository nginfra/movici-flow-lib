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
