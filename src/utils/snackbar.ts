import { SnackbarProgrammatic as Snackbar } from 'buefy';
import { BSnackbarConfig } from 'buefy/types/components';

export function successMessage(message: string) {
  openSnackbar({
    message: message,
    type: 'is-success',
    duration: 3000
  });
}

export function failMessage(message: string) {
  openSnackbar({
    message: message,
    type: 'is-danger',
    duration: 60000
  });
}

function openSnackbar(message: BSnackbarConfig) {
  Snackbar.open({
    type: 'is-success',
    position: 'is-top',
    queue: false,
    ...message
  });
}

export default {
  successMessage,
  failMessage
};
