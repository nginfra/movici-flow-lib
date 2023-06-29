import type { FlowLocation } from "@movici-flow-lib/types";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUIStore = defineStore("flow-ui", () => {
  const loading = ref(false);
  const collapse = ref(false);
  const collapserEnabled = ref(true);
  return {
    loading,
    collapse,
    collapserEnabled,
    setLocation(location: FlowLocation) {
      switch (location.step) {
        case "dataset":
          collapserEnabled.value = false;
          collapse.value = false;
          break;
        default:
          collapserEnabled.value = true;
      }
    },
  };
});
