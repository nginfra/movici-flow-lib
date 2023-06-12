import { vi } from "vitest";

const openDialog = vi.fn();
export function useDialog() {
  return {
    openDialog,
  };
}
