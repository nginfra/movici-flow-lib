import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "movici.editor.sidebar";

// This project's jsdom does not provide localStorage
function createStorageStub(): Storage {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, String(value));
    },
    removeItem: (key) => {
      entries.delete(key);
    },
    clear: () => entries.clear(),
    key: (index) => [...entries.keys()][index] ?? null,
    get length() {
      return entries.size;
    },
  };
}

async function freshSidebar() {
  vi.resetModules();
  const mod = await import("@movici-flow-lib/composables/useEditorSidebar");
  return mod.useEditorSidebar();
}

function stored() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

describe("useEditorSidebar", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageStub());
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the sidebar the first time a dataset is seen", async () => {
    const sidebar = await freshSidebar();
    sidebar.initForDataset("a");
    expect(sidebar.collapsed.value).toBe(false);
  });

  it("restores the collapsed state of a dataset across sessions", async () => {
    const first = await freshSidebar();
    first.initForDataset("a");
    first.setCollapsed(true);

    const second = await freshSidebar();
    second.initForDataset("a");
    expect(second.collapsed.value).toBe(true);
  });

  it("keeps state per dataset", async () => {
    const sidebar = await freshSidebar();
    sidebar.initForDataset("a");
    sidebar.setCollapsed(true);

    sidebar.initForDataset("b");
    expect(sidebar.collapsed.value).toBe(false);
    expect(stored()).toEqual({ a: { collapsed: true } });
  });

  it("survives corrupt storage", async () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    const sidebar = await freshSidebar();

    expect(() => sidebar.initForDataset("a")).not.toThrow();
    expect(sidebar.collapsed.value).toBe(false);
  });

  it("writes nothing when no dataset is active yet", async () => {
    const sidebar = await freshSidebar();
    sidebar.setCollapsed(true);

    expect(sidebar.collapsed.value).toBe(true);
    expect(stored()).toBeNull();
  });
});
