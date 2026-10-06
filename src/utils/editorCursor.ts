import type { EditModeKey } from "../stores/editor";
import type { CursorCallback } from "../types";

type CursorState = Parameters<CursorCallback>[0];

// null falls back to Deck.vue's default cursor
interface ToolCursor {
  idle: string | null;
  hover: string | null;
  drag: string | null;
}

const DEFAULT_CURSOR: ToolCursor = { idle: null, hover: null, drag: null };
const DRAW_CURSOR: ToolCursor = { idle: "crosshair", hover: "crosshair", drag: "grabbing" };

// A new mode without a cursor is a type error
const EDITOR_CURSORS: Record<EditModeKey, ToolCursor> = {
  view: DEFAULT_CURSOR,
  // The rectangle selection cancels panning
  "select-rectangle": { idle: "crosshair", hover: "crosshair", drag: "crosshair" },
  "select-polygon": DRAW_CURSOR,
  "draw-point": DRAW_CURSOR,
  "draw-line": DRAW_CURSOR,
  "draw-polygon": DRAW_CURSOR,
  modify: DEFAULT_CURSOR,
  translate: { idle: null, hover: "move", drag: "grabbing" },
  delete: { idle: "crosshair", hover: "pointer", drag: "grabbing" },
  measure: { idle: "crosshair", hover: "help", drag: "grabbing" },
};

// Cursor for the given edit mode; dragging wins over hovering
export function editorCursor(mode: EditModeKey, { isHovering, isDragging }: CursorState) {
  const cursor = EDITOR_CURSORS[mode];
  if (isDragging) return cursor.drag;
  if (isHovering) return cursor.hover;
  return cursor.idle;
}
