import type { RefLike } from "@movici-flow-lib/types";
import type { CSSProperties, Ref } from "vue";
import { ref, unref, watch } from "vue";

type HasElement = { $el: HTMLElement };
type ElementLike = HasElement | HTMLElement;
type ElementRef = Ref<ElementLike | null>;

export function useFixedPosition({
  overflowClass,
  adjust,
}: {
  overflowClass: string;
  adjust?: RefLike<{ top: number; left: number }>;
}) {
  const anchor = ref(null) as ElementRef;
  const fixedposition = ref(null) as ElementRef;

  const style = ref<CSSProperties>({});
  const visible = ref(false);

  let overflowParent: HTMLElement | null = null;

  /**
   * Takes a class and looks recursively for an parent element that has that class.
   * Used to get the overflow parent of this mixin component
   * @returns HTMLElement | null
   */
  function getOverflowParent(): HTMLElement | null {
    if (anchor.value) {
      return getOverflowParentHelper(overflowClass, asElement(anchor.value));
    }
    return null;
  }
  function update() {
    if (anchor.value && fixedposition.value) {
      const anchorRect = asElement(anchor.value).getBoundingClientRect();
      const fixedpositionRect = asElement(fixedposition.value).getBoundingClientRect();
      style.value = getStyle(anchorRect, fixedpositionRect, unref(adjust));

      if (overflowParent) {
        const overflowRect = overflowParent.getBoundingClientRect();

        // detect if either the anchor passed the top or bottom
        if (overflowRect.top > anchorRect.top || anchorRect.bottom > overflowRect.bottom) {
          visible.value = false;
        }
      }
    }
  }

  function toggle(force?: boolean) {
    visible.value = force ?? !visible.value;
    if (visible.value) {
      update();
    }
  }

  watch(anchor, () => {
    if (!overflowParent) {
      overflowParent = getOverflowParent();
      overflowParent?.addEventListener("scroll", () => {
        visible.value && update();
      });
    }
  });

  return {
    anchor,
    fixedposition,
    style,
    visible,
    toggle,
  };
}

function hasElement(obj: unknown): obj is HasElement {
  return (obj as HasElement).$el !== undefined;
}
function asElement(obj: ElementLike): HTMLElement {
  return hasElement(obj) ? obj.$el : obj;
}
function getOverflowParentHelper(targetClass: string, element: HTMLElement): HTMLElement | null {
  if (element.tagName.toLowerCase() === "html") {
    return null;
  }
  if (element.classList.contains(targetClass)) {
    return element;
  }
  if (element.parentElement) {
    return getOverflowParentHelper(targetClass, element.parentElement);
  }
  return null;
}

/**
 * Values calculates where the popup should be in reference to it's anchor
 * This is done using 'position: fixed', so this can be used where a parent
 * of the component has scrollbar overflow
 * @param anchorRect Simplified rectangle properties of the anchor
 * @param fixedpositionRect Simplified rectangle properties of the popup
 * @param adjust top and left adjusts
 */
function getStyle(
  anchorRect: { left: number; top: number; width: number; height: number },
  fixedpositionRect: { width: number; height: number },
  adjust?: { left: number; top: number },
): CSSProperties {
  // In order to prevent the popup from being positioned outside of the viewport
  // (as best we can), we have to know its dimensions. This way, we can limit
  // offsets as the popup approaches the edge of the viewport.
  // --
  // PERFORMANCE NOTE: For a small improvement, we could gather these dimensions
  // of the popup at the time we first render it. However, then we'd have to store
  // them as component properties and I wanted to keep this as simple as possible.

  const popupWidth = fixedpositionRect.width,
    popupHeight = fixedpositionRect.height,
    anchorWidth = anchorRect.width,
    windowWidth = document.documentElement.clientWidth,
    windowHeight = document.documentElement.clientHeight,
    // NOTE: When positioning the popup, we are translating an ABSOLUTE position (the
    // anchor) into a FIXED position (the popup). As such, we have to take the window
    // scroll-offsets into account.

    // First, let's calculate the "natural" position of the popup relative to the
    // anchor. This would be the position if we didn't want to constrain the location
    // of the popup relative to the viewport.
    naturalLeft = anchorRect.left + (adjust?.left ?? 0),
    naturalTop = anchorRect.top + (adjust?.top ?? 0),
    // Second, let's calculate the constrained position of the popup relative to the
    // viewport (such that the popup doesn't overlap with the edge of the viewport).
    // --
    // NOTE: In the following calculations, the "10" is the distance we want to keep
    // the popup away from the edges of the viewport.
    minLeft = 10,
    maxLeft = windowWidth - popupWidth - 10,
    minTop = 10,
    maxTop = windowHeight - popupHeight - 10;

  return {
    // Make sure we don't go too far right or left.
    left: Math.max(minLeft, Math.min(naturalLeft + anchorWidth, maxLeft)) + "px",
    // Make sure we don't go too far down or up.
    top: Math.max(minTop, Math.min(naturalTop, maxTop)) + "px",

    // cast this as !important is not allowed in CSSProperties
    position: "fixed !important" as CSSProperties["position"],
    zIndex: 99,
  };
}
