import { Vue } from 'vue-property-decorator';
/**
 * FixedPosition is a mixin to handle "relative positioned components" inside a scrollbar overflow.
 * We have a reference for the popup and a reference for the trigger.
 * This values are turned into bounding rectangles in reset() and calls the resetPosition.
 * If there's a overflow parent, then we setup the event bus to trigger it whenever the parent is scrolled.
 * This will update the popup style position correctly.
 */
export default class FixedPosition extends Vue {
    readonly popupRef: HTMLElement;
    readonly anchorRef: HTMLElement;
    overflowParent: Element | null;
    style: Partial<CSSStyleDeclaration>;
    visible: boolean;
    adjust: {
        top: number;
        left: number;
    };
    toggle(force?: boolean): void;
    mounted(): void;
    reset(): void;
    /**
     * Takes a class and looks recursively for an parent element that has that class.
     * Used to get the overflow parent of this mixin component
     * parent must be a Vue component
     * @param cssClass CSS class, in most times value is 'overflow'
     * @param vue_ this Vue instance, it's parent or elder parent
     * @returns Vue | null
     */
    getOverflowVueParent(cssClass: string, vue_?: Vue): Vue | null;
    /**
     * Values calculates where the popup should be in reference to it's anchor
     * This is done using 'position: fixed', so this can be used where a parent
     * of the component has scrollbar overflow
     * @param anchorRect Simplified rectangle properties of the anchor
     * @param popupRect Simplified rectangle properties of the popup
     * @param adjust top and left adjusts
     */
    resetPosition(anchorRect: {
        left: number;
        top: number;
        width: number;
        height: number;
    }, popupRect: {
        width: number;
        height: number;
    }, adjust?: {
        left: number;
        top: number;
    }): void;
}
