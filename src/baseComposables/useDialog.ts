import { useOruga } from "@oruga-ui/oruga-next";
import MovDialogModal from "../components/global/DialogModal.vue";
interface ShowDialogOptions {
  title?: string;
  message?: string;
  icon?: string;
  hasIcon?: boolean;
  variant?: string;
  size?: string;
  confirmButtonText?: string;
  canCancel?: boolean;
  cancelText?: string;
  type?: string;
  inputAttrs?: { value: string; required?: boolean };

  onConfirm?(prompt: string): void;
  onCancel?(): void;
}
export function useDialog() {
  // define functions for dialog and confirm
  const oruga = useOruga();
  return {
    openDialog(props: ShowDialogOptions) {
      return oruga.modal.open({
        component: MovDialogModal,
        props,
        trapFocus: true,
        canCancel: ["escape", "button", "outside"],
      });
    },
  };
}
