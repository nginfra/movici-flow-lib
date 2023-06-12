import { vi } from "vitest";
module.exports = {
  Map: vi.fn(() => ({
    on: vi.fn(),
    addControl: vi.fn(),
    jumpTo: vi.fn(),
  })),
  NavigationControl: vi.fn(() => {}),
};
