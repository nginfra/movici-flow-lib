import { useOruga } from "@oruga-ui/oruga-next";

export function useSnackbar() {
  const oruga = useOruga();

  function openSnackbar(params: Record<string, unknown>) {
    oruga.notification.open({
      position: "top",
      rootClass: "toast-notification",
      closeable: true,
      queue: false,
      ...params,
    });
  }
  return {
    failMessage(message: string) {
      openSnackbar({
        message: message,
        variant: "danger",
        duration: 10000,
      });
    },
    successMessage(message: string) {
      openSnackbar({
        message: message,
        variant: "success",
        duration: 3000,
      });
    },
  };
}
