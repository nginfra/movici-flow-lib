import type { RGBAColor } from "@movici-flow-common/types";
import NumberMapper from "./NumberMapper";

export const MoviciColors = {
  GREEN: "#1AB67E",
  ORANGE: "#F18759",
  RED: "#E54B4B",
  BLUE: "#5571F2",
  NAVY_BLUE: "#2962FF",
  LIGHT_BLUE: "#99AAF7",
  YELLOW: "#E8B53E",
  PURPLE: "#A258DC",
  PINK: "#F98BA6",
  LIGHT_PINK: "#F5B7B7",
  LIGHTEST_PINK: "#FADBDB",
  BROWN: "#BA763D",
  OLIVE: "#B2FF59",
  TURQUOISE: "#00BFA5",
  TEAL: "#18FFFF",
  WHITE: "#F1F1F1",
  VERY_LIGHT_GREY: "#CCCCCC",
  LIGHT_GREY: "#777777",
  DARK_GREY: "#333333",
  VERY_DARK_GREY: "#202020",
  BLACK: "#000000",
};

export class IntColorMap extends NumberMapper<RGBAColor> {
  useCache = true;
}

export function colorTripleToHex(color: RGBAColor): string {
  let rv = "#";
  for (const c of color) {
    if (c !== undefined) {
      rv += ("0" + c.toString(16)).slice(-2);
    }
  }
  return rv;
}

export function hexToColorTriple(hexColor: string): RGBAColor {
  const match = hexColor
    .toLowerCase()
    .match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/);
  if (!match) {
    throw new Error(`'${hexColor}' is not a valid hexadecimal color`);
  }
  const rv = match.splice(1).map((i) => (i ? parseInt(i, 16) : undefined));
  if (rv[3] === undefined) {
    rv.splice(3);
  }
  return rv as RGBAColor;
}
