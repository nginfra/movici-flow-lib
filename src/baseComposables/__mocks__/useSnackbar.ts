import { vi } from "vitest";
const failMessage = vi.fn();
const successMessage = vi.fn();

export function useSnackbar() {
  return {
    failMessage,
    successMessage,
  };
}
