import { lineString, point } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import type { PickInfo } from "deck.gl";
import type { DeckEntityObject, PointCoordinate } from "@movici-flow-common/types";
import type { CSSProperties } from "vue";

export const ANCHOR_POSITIONING = {
  top: { x: 0.5, y: 0 },
  "top-left": { x: 0, y: 0 },
  "top-right": { x: 1, y: 0 },
  bottom: { x: 0.5, y: 1 },
  "bottom-left": { x: 0, y: 1 },
  "bottom-right": { x: 1, y: 1 },
  left: { x: 0, y: 0.5 },
  right: { x: 1, y: 0.5 },
};

export type ANCHOR_TYPE = keyof typeof ANCHOR_POSITIONING;

export interface DynamicPositionOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
  selfWidth: number;
  selfHeight: number;
  anchorType: ANCHOR_TYPE;
  borderPadding?: { top?: number; right?: number; bottom?: number; left?: number };
}

/**
 * Function adapted from `react-map-gl` https://github.com/visgl/react-map-gl/blob/master/src/utils/dynamic-position.js
 * Calculate the dynamic position for a popup to fit in a container.
 * @param {Object} opts
 * @param {Number} opts.x - x position of the anchor on screen
 * @param {Number} opts.y - y position of the anchor on screen
 * @param {Number} opts.width - width of the container
 * @param {Number} opts.height - height of the container
 * @param {Number} opts.padding - extra space from the edge in pixels
 * @param {Number} opts.selfWidth - width of the popup
 * @param {Number} opts.selfHeight - height of the popup
 * @param {String} opts.anchorType - type of the anchor, one of 'top', 'bottom','left', 'right', 'top-left', 'top-right', 'bottom-left' , and  'bottom-right'
 * @returns {String} position - one of 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left' , and  'bottom-right'
 */

// eslint-disable-next-line complexity,max-statements
export function getDynamicPosition({
  x,
  y,
  width,
  height,
  selfWidth,
  selfHeight,
  anchorType,
  padding,
  borderPadding,
}: DynamicPositionOpts): ANCHOR_TYPE {
  const paddingTop = padding + (borderPadding?.top ?? 0);
  const paddingBottom = padding + (borderPadding?.bottom ?? 0);
  const paddingLeft = padding + (borderPadding?.left ?? 0);
  const paddingRight = padding + (borderPadding?.right ?? 0);

  let { x: anchorX, y: anchorY } = ANCHOR_POSITIONING[anchorType],
    top = y - anchorY * selfHeight,
    bottom = top + selfHeight,
    cutoffY = Math.max(0, paddingTop - top) + Math.max(0, bottom - height + paddingBottom);

  if (cutoffY > 0) {
    let bestAnchorY = anchorY,
      minCutoff = cutoffY;

    for (anchorY = 0; anchorY <= 1; anchorY += 0.5) {
      top = y - anchorY * selfHeight;
      bottom = top + selfHeight;
      cutoffY = Math.max(0, paddingTop - top) + Math.max(0, bottom - height + paddingBottom);

      if (cutoffY < minCutoff) {
        minCutoff = cutoffY;
        bestAnchorY = anchorY;
      }
    }
    anchorY = bestAnchorY;
  }

  // If needed, adjust anchorX at 0.5 step between [0, 1]
  let xStep = 0.5;
  if (anchorY === 0.5) {
    // If y is centered, then x cannot also be centered
    anchorX = Math.floor(anchorX);
    xStep = 1;
  }

  // anchorX: left - 0, center - 0.5, right - 1
  // left offset must consider if view is collapsed or not
  let left = x - anchorX * selfWidth,
    right = left + selfWidth,
    cutoffX = Math.max(0, paddingLeft - left) + Math.max(0, right - width + paddingRight);

  if (cutoffX > 0) {
    // Needs horizontal adjustment
    let bestAnchorX = anchorX,
      minCutoff = cutoffX;

    // Test anchorX at xStep between [0, 1]
    for (anchorX = 0; anchorX <= 1; anchorX += xStep) {
      left = x - anchorX * selfWidth;
      right = left + selfWidth;
      cutoffX = Math.max(0, paddingLeft - left) + Math.max(0, right - width + paddingRight);
      if (cutoffX < minCutoff) {
        minCutoff = cutoffX;
        bestAnchorX = anchorX;
      }
    }
    anchorX = bestAnchorX;
  }

  // Find the name of the new anchor position
  return (
    (Object.keys(ANCHOR_POSITIONING) as ANCHOR_TYPE[]).find((anchorType: ANCHOR_TYPE) => {
      const overrideAnchor: { x: number; y: number } = ANCHOR_POSITIONING[anchorType];
      return overrideAnchor.x === anchorX && overrideAnchor.y === anchorY;
    }) || anchorType
  );
}

// function adapted from `react-map-gl` https://github.com/visgl/react-map-gl/blob/master/src/components/popup.js
export function getContainerStyle({
  x,
  y,
  width,
  height,
  selfWidth,
  selfHeight,
  padding,
  anchorType,
}: Omit<DynamicPositionOpts, "borderPadding">) {
  const z = 0,
    directionMap = {
      left: anchorType.includes("left"),
      right: anchorType.includes("right"),
      top: anchorType.includes("top"),
      bottom: anchorType.includes("bottom"),
    };

  let style: CSSProperties = {};

  const pixelRatio = (typeof window !== "undefined" && window.devicePixelRatio) || 1,
    crispPixel = (size: number) => Math.round(size * pixelRatio) / pixelRatio,
    crispPercentage = (origSize: number, percentage: number) => {
      return (crispPixel((percentage / 100) * origSize) / origSize) * 100;
    },
    xPadding = directionMap.left ? -padding : directionMap.right ? padding : 0,
    yPadding = directionMap.top ? -padding : directionMap.bottom ? padding : 0,
    sortByDepth = false,
    anchorPosition = ANCHOR_POSITIONING[anchorType],
    left = x - xPadding,
    top = y - yPadding,
    xPercentage = crispPercentage(selfWidth, -anchorPosition.x * 100),
    yPercentage = crispPercentage(selfHeight, -anchorPosition.y * 100);

  style = {
    position: "absolute",
    transform: `
        translate(${xPercentage}%, ${yPercentage}%)
        translate(${crispPixel(left)}px, ${crispPixel(top)}px)
      `,
    display: String(),
  };

  if (!sortByDepth) {
    return style;
  }

  if (z > 1 || z < -1 || x < 0 || x > width || y < 0 || y > height) {
    // clipped
    style.display = "none";
  } else {
    // use z-index to rearrange components
    style.zIndex = Math.floor(((1 - z) / 2) * 100000);
  }

  return style;
}

export function getNearestPointOnLine(pickInfo: PickInfo<DeckEntityObject<unknown>>) {
  return nearestPointOnLine(
    lineString((pickInfo.object as { coordinates: PointCoordinate[] }).coordinates),
    point(pickInfo.coordinate as PointCoordinate)
  ).geometry.coordinates;
}

export function getPointCenter(pickInfo: PickInfo<DeckEntityObject<unknown>>) {
  return (pickInfo.object as { coordinates: PointCoordinate }).coordinates;
}

export function getClickPosition(pickInfo: PickInfo<DeckEntityObject<unknown>>) {
  return pickInfo.coordinate as PointCoordinate;
}
