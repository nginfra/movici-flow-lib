import { computed, reactive, unref, watchEffect, type Ref } from "vue";

import type { ButtonItem, RefLike } from "@movici-flow-common/types";

type SupportedButton = "cancel" | "save" | "saveAndEdit" | "back" | "delete" | "refresh";

interface ButtonConfig {
  name: SupportedButton;
  label: string;
  icon: string;
  variant?: string;
  iconPack?: string;
}

function makeButton(
  config: ButtonConfig,
  disabled?: RefLike<Partial<Record<SupportedButton, boolean>>>
): ButtonItem {
  const { name, ...config_ } = config;
  const rawResult = { ...config_, event: name, isDisabled: false };
  if (!disabled) return rawResult;

  const result = reactive({ ...rawResult, isDisabled: unref(disabled)[name] ?? false });
  watchEffect(() => {
    result.isDisabled = unref(disabled)[name] ?? false;
  });
  return result;
}

export function useButtons(
  disabled?: RefLike<Record<string, boolean>>
): Record<SupportedButton, ButtonItem> {
  return {
    cancel: makeButton(
      {
        name: "cancel",
        label: "actions.cancel",
        icon: "times",
        iconPack: "fas",
      },
      disabled
    ),
    save: makeButton(
      {
        name: "save",
        variant: "primary",
        label: "actions.save",
        icon: "edit",
        iconPack: "fas",
      },
      disabled
    ),
    saveAndEdit: makeButton(
      {
        name: "saveAndEdit",
        variant: "primary",
        label: "actions.saveAndEdit",
        icon: "fa-mov-save",
        iconPack: "fak",
      },
      disabled
    ),
    back: makeButton(
      {
        name: "back",
        label: "actions.back",
        icon: "arrow-left",
        iconPack: "fas",
      },
      disabled
    ),
    delete: makeButton(
      {
        name: "delete",
        variant: "danger",
        label: "actions.delete",
        icon: "times",
        iconPack: "fas",
      },
      disabled
    ),
    refresh: makeButton({
      variant: "primary",
      label: "actions.refresh",
      icon: "redo",
      iconPack: "fas",
      name: "refresh",
    }),
  };
}

export function useButtonArray(
  buttons: SupportedButton[],
  disabled?: RefLike<Record<string, boolean>>
): Ref<ButtonItem[]> {
  const allButtons = useButtons(disabled);
  return computed(() =>
    buttons.reduce((agg, curr) => {
      agg.push(allButtons[curr]);
      return agg;
    }, [] as ButtonItem[])
  );
}
