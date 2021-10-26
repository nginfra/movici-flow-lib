export interface ActionMenuItem {
  icon?: string;
  iconPack?: string;
  label: string;
  event: string;
  colorScheme?: string;
  isDisabled?: () => boolean;
}
