import { usePopupStore } from "@movici-flow-common/stores/popup";
import type { PopupContent, PopupInfo } from "@movici-flow-common/types";
import { createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makePopup(newPopup: Partial<PopupInfo & { entityIndex: number }>): PopupInfo {
  return {
    layerId: "some-layer",
    kind: "map-hover",
    content: {
      entityIndex: newPopup.entityIndex ?? 1,
    } as PopupContent,
    ...newPopup,
  };
}
describe("usePopupStore", () => {
  let store: ReturnType<typeof usePopupStore>;
  beforeEach(() => {
    vi.useFakeTimers();
    store = usePopupStore(createPinia());
  });
  it("adds new popup to map popups", () => {
    store.popups.push(makePopup({ kind: "map-hover" }));
    expect(store.mapPopups).toHaveLength(1);
    expect(store.rightSidePopups).toHaveLength(0);
  });

  it("add new popup to right side popups", () => {
    store.popups.push(makePopup({ kind: "right-side" }));

    expect(store.mapPopups).toHaveLength(0);
    expect(store.rightSidePopups).toHaveLength(1);
  });

  it("removes layer's map popups when layer is toggled invisible", () => {
    store.popups.push(
      makePopup({ kind: "right-side", layerId: "some-layer" }),
      makePopup({ kind: "map-hover", layerId: "some-layer" }),
      makePopup({ kind: "map-hover", layerId: "some-other-layer" })
    );
    expect(store.mapPopups).toHaveLength(2);
    expect(store.rightSidePopups).toHaveLength(1);

    store.layerIsHidden("some-layer");
    expect(store.mapPopups).toHaveLength(1);
    expect(store.rightSidePopups).toHaveLength(1);
  });

  it("removes all layer's popups when layer is removed", () => {
    store.popups.push(
      makePopup({ kind: "right-side", layerId: "some-layer" }),
      makePopup({ kind: "map-hover", layerId: "some-layer" }),
      makePopup({ kind: "map-hover", layerId: "some-other-layer" })
    );
    expect(store.mapPopups).toHaveLength(2);
    expect(store.rightSidePopups).toHaveLength(1);

    store.layerIsRemoved("some-layer");
    expect(store.mapPopups).toHaveLength(1);
    expect(store.rightSidePopups).toHaveLength(0);
  });

  it("removes a popup", () => {
    const popup = makePopup({ kind: "map-hover" });
    store.popups.push(popup);
    store.remove(popup);
    expect(store.mapPopups).toHaveLength(0);
  });
  it("throws when removing popup at invalid index", () => {
    store.popups.push(makePopup({ kind: "map-hover" }));
    const invalidPopup = makePopup({ entityIndex: 2 });
    expect(() => store.remove(invalidPopup)).toThrow();
  });
  it("moves popup to bottom", () => {
    store.popups.push(
      makePopup({ kind: "map-hover", layerId: "some-layer" }),
      makePopup({ kind: "map-hover", layerId: "some-other-layer" })
    );
    store.moveToBottom(makePopup({ kind: "map-hover", layerId: "some-layer" }));
    expect(store.popups[1].layerId).toStrictEqual("some-layer");
  });

  it("toggles popup between map and rightside", () => {
    const popup = makePopup({ kind: "map-hover" });
    store.popups.push(popup);
    store.toggleLocation(popup);
    expect(store.popups[0].kind).toStrictEqual("right-side");
    store.toggleLocation(popup);
    expect(store.popups[0].kind).toStrictEqual("map-persistent");
  });

  it("clears accents", () => {
    store.popups.push(makePopup({ accent: "strong" }), makePopup({ accent: "weak" }));
    store.clearAccents();
    expect(store.popups[0].accent).toBeFalsy();
    expect(store.popups[1].accent).toBeFalsy();
  });

  it("clears accents for specific accent", () => {
    store.popups.push(makePopup({ accent: "strong" }), makePopup({ accent: "weak" }));
    store.clearAccents("strong");

    expect(store.popups[0].accent).toBeFalsy();
    expect(store.popups[1].accent).toEqual("weak");
  });
  it("clears all current data on reset", () => {
    store.popups.push(makePopup({}));
    store.reset();
    vi.runAllTimers();
    expect(store.popups).toHaveLength(0);
  });

  it("clears a pending popup on reset", () => {
    store.onHover({ entityIndex: 1 } as PopupContent, "some-layer");
    store.reset();
    vi.runAllTimers();
    expect(store.popups).toHaveLength(0);
  });
  describe("onClick", () => {
    it("creates a popup on click", () => {
      expect(store.popups).toHaveLength(0);
      const content = {
        pickInfo: Symbol("pickInfo"),
      } as PopupContent;

      store.onClick(content, "some-layer");
      expect(store.popups[0]).toStrictEqual({
        kind: "map-persistent",
        layerId: "some-layer",
        content,
      });
    });
    it("makes a hovering popup persistent", () => {
      store.popups.push(makePopup({ kind: "map-hover" }));
      const content = {
        entityIndex: 1,
        pickInfo: Symbol("pickInfo"),
      } as PopupContent;

      store.onClick(content, "some-layer");
      expect(store.popups[0].kind).toStrictEqual("map-persistent");
    });

    it("attaches the new popup content to an existing popup", () => {
      store.popups.push(makePopup({ kind: "map-hover" }));
      const content = {
        entityIndex: 1,
        pickInfo: Symbol("pickInfo"),
      } as PopupContent;

      store.onClick(content, "some-layer");
      expect(store.popups[0].content).toStrictEqual(content);
    });
    it("removes an existing persistent popup", () => {
      store.popups.push(makePopup({ kind: "map-persistent" }));

      store.onClick({ entityIndex: 1 } as PopupContent, "some-layer");
      expect(store.popups).toHaveLength(0);
    });

    it("highlights an existing right side popup", () => {
      store.popups.push(makePopup({ kind: "right-side" }));
      store.onClick({ entityIndex: 1 } as PopupContent, "some-layer");
      expect(store.popups[0].accent).toStrictEqual("strong");
      vi.runAllTimers();
      expect(store.popups[0].accent).toBeFalsy();
    });
  });
  describe("onHover", () => {
    it("clears existing hover popups when null", () => {
      store.popups.push(makePopup({ kind: "map-hover" }));
      store.onHover(null, "");
      expect(store.popups).toHaveLength(0);
    });
    it("clears accents when null", () => {
      store.popups.push(
        makePopup({ kind: "right-side", accent: "strong" }),
        makePopup({ kind: "right-side", accent: "weak" })
      );
      store.onHover(null, "");
      expect(store.popups[0].accent).toBeFalsy();
      expect(store.popups[1].accent).toBeFalsy();
    });

    it("pends a popup on hover", () => {
      const content = {
        pickInfo: Symbol("pickInfo"),
      } as PopupContent;

      store.onHover(content, "some-layer");
      expect(store.popups).toHaveLength(0);
      vi.runAllTimers();
      expect(store.popups[0]).toStrictEqual({
        kind: "map-hover",
        layerId: "some-layer",
        content,
      });
    });

    it("pends to update content on existing hovering popup", () => {
      store.popups.push(makePopup({ kind: "map-hover" }));
      const content = {
        entityIndex: 1,
        pickInfo: Symbol("pickInfo"),
      } as PopupContent;
      store.onHover(content, "some-layer");
      expect(store.popups[0].content).toStrictEqual({ entityIndex: 1 });
      vi.runAllTimers();
      expect(store.popups[0].content).toStrictEqual(content);
    });

    it("removes any lingering hover popups when encountering a persistent popup", () => {
      store.popups.push(
        makePopup({ kind: "map-hover", content: { entityIndex: 2 } as PopupContent })
      );
      store.popups.push(makePopup({ kind: "map-persistent" }));
      store.onHover({ entityIndex: 1 } as PopupContent, "some-layer");
      expect(store.popups[0].kind).toEqual("map-persistent");
    });

    it("gives other right-side popups a weak accent", () => {
      store.popups.push(makePopup({ kind: "right-side", entityIndex: 1 }));
      store.popups.push(makePopup({ kind: "right-side", entityIndex: 2 }));

      store.onHover({ entityIndex: 1 } as PopupContent, "some-layer");
      expect(store.popups[0].accent).toBeFalsy();
      expect(store.popups[1].accent).toStrictEqual("weak");
    });
  });
});
