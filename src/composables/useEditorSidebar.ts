import { ref } from "vue";

const STORAGE_KEY = "movici.editor.sidebar";

type SidebarStorage = Record<string, { collapsed: boolean }>;

const collapsed = ref(false);

const activeUUID = ref<string | null>(null);

function readAll(): SidebarStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SidebarStorage) : {};
  } catch {
    return {};
  }
}

function writeAll(state: SidebarStorage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useEditorSidebar() {
  // The sidebar is shown (open) when a user changes from 'data preview'
  // to 'editor' tab, for the very first time.
  // After that the state is tracked and maintain by SidebarStorage.
  function initForDataset(uuid: string) {
    activeUUID.value = uuid;
    collapsed.value = readAll()[uuid]?.collapsed ?? false;
  }

  function setCollapsed(value: boolean) {
    collapsed.value = value;
    const uuid = activeUUID.value;
    if (!uuid) return;
    const all = readAll();
    all[uuid] = { collapsed: value };
    writeAll(all);
  }

  return { collapsed, initForDataset, setCollapsed };
}
