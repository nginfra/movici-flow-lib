import type { BackendCapability } from "@movici-flow-lib/types";
import { vi } from "vitest";
export function useFakeBackend(capabilities?: BackendCapability[]) {
  return {
    getCapabilities: () => capabilities ?? ["geocode", "projects", "user"],
    project: {
      list: vi.fn(),
    },

    dataset: {
      list: vi.fn(),
      getData: vi.fn(),
      getState: vi.fn(),
      getMetaData: vi.fn(),
    },
    scenario: {
      get: vi.fn(),
      list: vi.fn(),
    },
    view: {
      list: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    geocode: {
      upstreamEPSG: vi.fn(),
      resolveSuggestion: vi.fn(),
      getResults: vi.fn(),
      getSuggestions: vi.fn(),
    },
    summary: {
      getDataset: vi.fn(),
      getScenario: vi.fn(),
    },
    updates: {
      list: vi.fn(),
      get: vi.fn(),
    },
    user: {
      get: vi.fn(),
    },
    fetch: {
      getRequest: vi.fn(),
    },
  };
}
