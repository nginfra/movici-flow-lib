import type { EditModeKey } from "@movici-flow-lib/stores/editor";
import { editorCursor } from "@movici-flow-lib/utils/editorCursor";
import { describe, expect, it } from "vitest";

const IDLE = { isHovering: false, isDragging: false };
const HOVER = { isHovering: true, isDragging: false };
const DRAG = { isHovering: false, isDragging: true };
const HOVER_DRAG = { isHovering: true, isDragging: true };

describe("editorCursor", () => {
  it.each([IDLE, HOVER, DRAG, HOVER_DRAG])(
    "keeps the default cursor in view mode (%o)",
    (state) => {
      expect(editorCursor("view", state)).toBeNull();
    },
  );

  it.each([
    // mode, idle, hover, drag
    ["select-rectangle", "crosshair", "crosshair", "crosshair"],
    ["select-polygon", "crosshair", "crosshair", "grabbing"],
    ["draw-point", "crosshair", "crosshair", "grabbing"],
    ["draw-line", "crosshair", "crosshair", "grabbing"],
    ["draw-polygon", "crosshair", "crosshair", "grabbing"],
    ["modify", null, null, null],
    ["translate", null, "move", "grabbing"],
    ["delete", "crosshair", "pointer", "grabbing"],
    ["measure", "crosshair", "help", "grabbing"],
  ] as [EditModeKey, string | null, string | null, string | null][])(
    "returns the %s cursor",
    (mode, idle, hover, drag) => {
      expect(editorCursor(mode, IDLE)).toBe(idle);
      expect(editorCursor(mode, HOVER)).toBe(hover);
      expect(editorCursor(mode, DRAG)).toBe(drag);
    },
  );

  it("prefers the drag cursor over the hover cursor", () => {
    expect(editorCursor("measure", HOVER_DRAG)).toBe("grabbing");
    expect(editorCursor("translate", HOVER_DRAG)).toBe("grabbing");
  });
});
