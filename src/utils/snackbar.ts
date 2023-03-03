import { NotificationProgrammatic as Notification } from '@oruga-ui/oruga';
export function successMessage(message: string) {
  openSnackbar({
    message: message,
    variant: 'success',
    duration: 3000
  });
}

export function failMessage(message: string) {
  openSnackbar({
    message: message,
    variant: 'danger',
    duration: 3000
  });
}

function openSnackbar(params: Record<string, unknown>) {
  Notification.open({
    position: 'top',
    rootClass: 'toast-notification',
    closable: true,
    queue: false,
    ...params
  });
}

export default {
  successMessage,
  failMessage
};
