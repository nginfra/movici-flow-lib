import truncate_ from "lodash/truncate";
import upperFirst_ from "lodash/upperFirst";

export function dateTimeString(value?: number | null) {
  if (value == null) return "";
  return new Date(value * 1000).toLocaleString("NL");
}
export function dateString(value?: number | null) {
  if (value == null) return "";
  return new Date(value * 1000).toLocaleDateString("NL");
}
export function snakeToSpaces(value?: string | null) {
  if (value == null) return "";
  return value.replaceAll("_", " ");
}
export function upperFirst(value?: string | null) {
  if (value == null) return "";
  return upperFirst_(value.toLowerCase());
}
export function truncate(value?: string | null) {
  if (value == null) return "";
  return truncate_(value);
}

export function snakeToFriendly(value?: string | null) {
  return upperFirst(snakeToSpaces(value));
}
