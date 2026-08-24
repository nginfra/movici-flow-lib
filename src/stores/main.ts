import { defaultClient } from "../api/client";
import type { IClient } from "../types";
import { global } from "@/i18n";
import { defineStore } from "pinia";
import { type Ref, ref } from "vue";
import { useSettingsStore } from "./settings";
import { useSnackbar } from "@movici-flow-lib/baseComposables/useSnackbar";
import { setClient, setProjections } from "@movici-flow-lib/crs";

export const useMainStore = defineStore("main", () => {
  const client: Ref<IClient> = ref(
    defaultClient({
      baseURL: "/",
      callbacks: {
        http(e) {
          failMessage(e.message);
        },
      },
    }),
  );
  const initialized = ref(false);
  const settingsStore = useSettingsStore();
  const { failMessage } = useSnackbar();

  return {
    initialized,
    client,
    async initilizedApp() {
      settingsStore.loadLocal();

      global.locale.value = settingsStore.locale;
      client.value.baseURL = settingsStore.baseURL;
      setClient(client.value);
      setProjections(settingsStore.projections);
    },
  };
});
