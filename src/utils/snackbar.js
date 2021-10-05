import { SnackbarProgrammatic as Snackbar } from 'buefy';
export function successMessage(message) {
    openSnackbar({
        message: message,
        type: 'is-success',
        duration: 3000
    });
}
export function failMessage(message) {
    openSnackbar({
        message: message,
        type: 'is-danger',
        duration: 60000
    });
}
function openSnackbar(message) {
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
