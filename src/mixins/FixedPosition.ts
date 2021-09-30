import { Component, Vue } from 'vue-property-decorator';

function isVue(thing: unknown): thing is Vue {
  return (thing as Vue).$el !== undefined;
}

function asElement(thing: Element | Vue | null): Element | null {
  if (thing === null) {
    return null;
  }
  return isVue(thing) ? thing.$el : thing;
}

/**
 * FixedPosition is a mixin to handle "relative positioned components" inside a scrollbar overflow.
 * We have a reference for the popup and a reference for the trigger.
 * This values are turned into bounding rectangles in reset() and calls the resetPosition.
 * If there's a overflow parent, then we setup the event bus to trigger it whenever the parent is scrolled.
 * This will update the popup style position correctly.
 */
@Component
export default class FixedPosition extends Vue {
  readonly popupRef!: HTMLElement;
  readonly anchorRef!: HTMLElement;
  overflowParent: Element | null = null;
  style: Partial<CSSStyleDeclaration> = {};
  visible = false;
  adjust = {
    top: 0,
    left: 0
  };

  toggle(force?: boolean) {
    this.visible = force ?? !this.visible;
    if (this.visible) {
      this.reset();
    }
  }

  mounted() {
    this.overflowParent = asElement(this.getOverflowVueParent('x-overflow'));
    if (this.overflowParent) {
      this.overflowParent.addEventListener('scroll', () => {
        this.visible && this.reset();
      });
    }
  }

  reset() {
    if (this.anchorRef && this.popupRef) {
      const anchorRect = this.anchorRef.getBoundingClientRect(),
        popupRect = this.popupRef.getBoundingClientRect();

      this.resetPosition(anchorRect, popupRect, this.adjust);

      if (this.overflowParent) {
        const overflowRect = this.overflowParent.getBoundingClientRect();

        // detect if either the anchor passed the top or bottom
        if (overflowRect.top > anchorRect.top || anchorRect.bottom > overflowRect.bottom) {
          this.visible = false;
        }
      }
    }
  }

  /**
   * Takes a class and looks recursively for an parent element that has that class.
   * Used to get the overflow parent of this mixin component
   * parent must be a Vue component
   * @param cssClass CSS class, in most times value is 'overflow'
   * @param vue_ this Vue instance, it's parent or elder parent
   * @returns Vue | null
   */
  getOverflowVueParent(cssClass: string, vue_?: Vue): Vue | null {
    vue_ ??= this;

    const { $el, $parent } = vue_;

    // if the element has the class we are looking for, we return it,
    // else, if it has a parent, we recursively call gerOverflowParent to check for it's parent
    // else reached the end of DOM no parent has overflow class.
    if ($el?.classList.contains(cssClass)) {
      return vue_;
    } else if ($parent) {
      return this.getOverflowVueParent(cssClass, $parent);
    } else {
      return null;
    }
  }

  /**
   * Values calculates where the popup should be in reference to it's anchor
   * This is done using 'position: fixed', so this can be used where a parent
   * of the component has scrollbar overflow
   * @param anchorRect Simplified rectangle properties of the anchor
   * @param popupRect Simplified rectangle properties of the popup
   * @param adjust top and left adjusts
   */
  resetPosition(
    anchorRect: { left: number; top: number; width: number; height: number },
    popupRect: { width: number; height: number },
    adjust?: { left: number; top: number }
  ) {
    const popupStyle: Partial<CSSStyleDeclaration> = {};
    if (popupRect && anchorRect) {
      // In order to prevent the popup from being positioned outside of the viewport
      // (as best we can), we have to know its dimensions. This way, we can limit
      // offsets as the popup approaches the edge of the viewport.
      // --
      // PERFORMANCE NOTE: For a small improvement, we could gather these dimensions
      // of the popup at the time we first render it. However, then we'd have to store
      // them as component properties and I wanted to keep this as simple as possible.

      const popupWidth = popupRect.width,
        popupHeight = popupRect.height,
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

      // Make sure we don't go too far right or left.
      popupStyle.left = Math.max(minLeft, Math.min(naturalLeft + anchorWidth, maxLeft)) + 'px';
      // Make sure we don't go too far down or up.
      popupStyle.top = Math.max(minTop, Math.min(naturalTop, maxTop)) + 'px';
      popupStyle.position = 'fixed !important';
    }

    this.style = popupStyle;
  }
}
