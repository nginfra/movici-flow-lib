import type { PopupAccent, PopupContent, PopupInfo } from "@movici-flow-lib/types";
import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";

type Timeouts<K extends string> = {
  [P in K]?: ReturnType<typeof setTimeout> | null;
};

const POPUP_DELAY = 250,
  POPUP_HIGHLIGHT_DURATION = 200;

export const usePopupStore = defineStore("flow-popup", () => {
  const popups = ref([]) as Ref<PopupInfo[]>;
  const mapPopups = computed(() => popups.value.filter((p) => p.kind != "right-side"));
  const rightSidePopups = computed(() => popups.value.filter((p) => p.kind == "right-side"));
  const timeouts: Timeouts<"clickAccent" | "hover"> = {};

  function setPopupTimeout(key: keyof typeof timeouts, timeout: () => void, delayms: number) {
    resetTimeout(key);
    timeouts[key] = setTimeout(() => {
      timeout();
      timeouts[key] = null;
    }, delayms);
  }

  function resetTimeout(...keys: (keyof typeof timeouts)[]) {
    if (!keys.length) {
      keys = ["clickAccent", "hover"];
    }
    for (const key of keys) {
      const timeout = timeouts[key];
      if (timeout != null) {
        clearTimeout(timeout);
        timeouts[key] = null;
      }
    }
  }

  function findPopup(
    layerId: string,
    entityIndex: number
  ): [PopupInfo, number] | [undefined, undefined] {
    for (const [idx, popup] of popups.value.entries()) {
      if (popup.layerId === layerId && popup.content.entityIndex === entityIndex) {
        return [popup, idx];
      }
    }
    return [undefined, undefined];
  }
  function getIndex(popup: PopupInfo) {
    for (const [idx, p] of popups.value.entries()) {
      if (popup.layerId === p.layerId && popup.content.entityIndex === p.content.entityIndex) {
        return idx;
      }
    }
    throw new Error(`Popup not found for entity: ${popup.layerId}: ${popup.content.entityIndex}`);
  }

  function remove(popup: PopupInfo) {
    popups.value.splice(getIndex(popup), 1);
  }

  function removeHoverPopups() {
    popups.value = popups.value.filter((p) => p.kind != "map-hover");
  }

  function clearAccents(accent?: PopupAccent) {
    for (const popup of popups.value) {
      if (!accent || popup.accent === accent) {
        popup.accent = null;
      }
    }
  }

  return {
    popups,
    mapPopups,
    rightSidePopups,
    layerIsHidden(layerId: string) {
      popups.value = popups.value.filter((p) => p.layerId != layerId || p.kind === "right-side");
    },
    layerIsRemoved(layerId: string) {
      popups.value = popups.value.filter((p) => p.layerId != layerId);
    },
    remove,
    moveToBottom(popup: PopupInfo) {
      const index = getIndex(popup);
      const [toBottom] = popups.value.splice(index, 1);
      popups.value.push(toBottom);
    },
    clearAccents,
    toggleLocation(popup: PopupInfo) {
      popup.kind = popup.kind === "right-side" ? "map-persistent" : "right-side";
      this.moveToBottom(popup);
    },

    onClick(content: PopupContent, layerId: string) {
      resetTimeout("hover");

      const [found] = findPopup(layerId, content.entityIndex);

      if (!found) {
        clearAccents();
        popups.value.push({
          layerId,
          content,
          kind: "map-persistent",
        });
        return;
      }
      found.content = content;

      switch (found.kind) {
        case "map-hover":
          found.kind = "map-persistent";
          return;

        case "map-persistent":
          remove(found);
          return;

        case "right-side":
          found.accent = "strong";
          setPopupTimeout("clickAccent", () => (found.accent = null), POPUP_HIGHLIGHT_DURATION);
      }
    },

    onHover(content: PopupContent | null, layerId: string) {
      resetTimeout("hover");

      if (!content) {
        removeHoverPopups();
        clearAccents();
        return;
      }
      const [found, foundIdx] = findPopup(layerId, content.entityIndex);

      if (!found) {
        removeHoverPopups();
        clearAccents("weak");
        setPopupTimeout(
          "hover",
          () => popups.value.push({ layerId, content, kind: "map-hover" }),
          POPUP_DELAY
        );

        return;
      }

      switch (found.kind) {
        case "map-hover":
          setPopupTimeout("hover", () => (found.content = content), POPUP_DELAY);
          return;

        case "map-persistent":
          // when we reach this, there should not be a hover popup open, but just in case we
          // remove all hover popups so that we surely don't have a hover popup for the same entity
          // as we have a map-persistent popup
          removeHoverPopups();
          return;

        case "right-side":
          for (const [idx, popup] of popups.value.entries()) {
            if (idx == foundIdx) continue;
            if (popup.kind === "right-side") {
              popup.accent = "weak";
            }
          }
      }
    },
    reset() {
      resetTimeout();
      popups.value = [];
    },
  };
});
