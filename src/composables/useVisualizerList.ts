import { useDialog } from "@movici-flow-common/baseComposables/useDialog";
import { computed, nextTick, ref, type Ref } from "vue";

export type FunctionOrString<T> = string | ((item?: T) => string);

export interface VisualizerListStrategy<T> {
  createNewMessage: FunctionOrString<T>;
  closeConfiguratorMessage: FunctionOrString<T>;
  deleteMessage: FunctionOrString<T>;
  finalizeItem?(item: T): T;
  onUpdate(val: T[]): void;
}
function evaluateMessage<T>(message: FunctionOrString<T>, item?: T) {
  return typeof message == "string" ? message : message(item);
}

export function useVisualizerList<T>({
  items,
  strategy,
  t,
}: {
  items: Ref<T[]>;
  strategy: VisualizerListStrategy<T>;
  t: (val: string) => string;
}) {
  const { openDialog } = useDialog();

  // openVal Indicates the index of the open Visualizer
  // Special values are
  // -1: Creates a new Visualizer
  // -2: The configurator is closed
  const open = ref(-2);
  const editing = computed(() => open.value > -2);
  function close() {
    open.value = -2;
  }

  // needs to detect unchanged saves in the VisConfig
  function startEditingItem(index: number) {
    if (open.value === -2) {
      open.value = index;
    } else if (open.value !== index) {
      // todo: detect changes in current visualizer configurator
      openDialog({
        message: evaluateMessage(strategy.closeConfiguratorMessage, items.value[index]),
        cancelText: t("actions.cancel"),
        confirmButtonText: t("misc.yes"),
        variant: "primary",
        canCancel: true,
        onConfirm: () => {
          // By first closing the old configurator and then opening a new one we force a recycle
          // of the configurator and clean up any residual data
          close();
          nextTick(() => {
            open.value = index;
          });
        },
      });
    }
  }

  function updateItem(idx: number, val: T) {
    strategy.onUpdate(
      items.value.map((info, arrayIdx) => {
        return arrayIdx === idx ? strategy.finalizeItem?.(val) ?? val : info;
      })
    );
  }

  function appendItem(val: T) {
    strategy.onUpdate([...items.value, strategy.finalizeItem?.(val) ?? val]);
  }

  const currentItem = computed(() => {
    return open.value < 0 ? undefined : items.value[open.value];
  });

  function updateCurrentItem(val?: T) {
    if (!val) return;
    if (open.value === -1) {
      open.value = items.value.length;
      appendItem(val);
    } else {
      updateItem(open.value, val);
    }
  }

  function deleteItem(idx: number) {
    openDialog({
      message: evaluateMessage(strategy.deleteMessage, items.value[idx]),
      cancelText: t("actions.cancel"),
      confirmButtonText: t("actions.delete"),

      variant: "danger",
      canCancel: true,
      onConfirm: () => {
        strategy.onUpdate(items.value.filter((_, arrayIdx) => idx !== arrayIdx));
        // if we delete what is open, we close the window
        if (open.value === idx) {
          close();
        }
      },
    });
  }

  return {
    open,
    close,
    editing,
    startEditingItem,
    updateItem,
    appendItem,
    deleteItem,
    currentItem,
    updateCurrentItem,
  };
}
