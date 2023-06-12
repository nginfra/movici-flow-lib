import type { Component } from "vue";

export type ActionType =
  | "add"
  | "view"
  | "edit"
  | "delete"
  | "duplicate"
  | "download"
  | "generate"
  | "play"
  | "reset"
  | "cancel"
  | "invite"
  | "logs";

export interface ButtonItem {
  icon?: string;
  iconPack?: string;
  label: string;
  event: string;
  variant?: string;
  isDisabled?: boolean;
}
export interface ActionItem extends ButtonItem {
  component?: Component;
}
