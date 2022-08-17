import { PopupContent, PopupPosition, PopupSettings, PopupType } from '@movici-flow-common/types';
import { PickInfo } from 'deck.gl';

const POPUP_DELAY = 250,
  POPUP_HIGHLIGHT_DURATION = 200;

function popupMatches(a: PopupSettings, b: PopupSettings) {
  return a.layerId == b.layerId && a.content.index == b.content.index;
}

export class PopupManager {
  popups: PopupSettings[] = [];
  lastHovered: [string, PopupContent] | null = null;
  timeoutTracker: Record<string, ReturnType<typeof setTimeout> | null> = {
    clickHighlight: null,
    hover: null,
    hoverUpdate: null
  };

  get visiblePopups() {
    return this.popups.filter(({ visible }) => visible);
  }

  get mapPopups() {
    return this.visiblePopups.filter(({ position }) => position === 'map');
  }

  get rightSidePopups() {
    return this.visiblePopups.filter(({ position }) => position === 'right-side');
  }

  setPopups(popups: PopupSettings[]) {
    this.popups = popups;
  }

  updatePopupVisibilityByLayer({ layerId, visible }: { layerId: string; visible: boolean }) {
    this.setPopups(
      this.popups.map(p => {
        return p.layerId === layerId ? { ...p, visible } : p;
      })
    );
  }

  updatePopupInfo(settings: PopupSettings, pickInfo: PickInfo<unknown>) {
    this.setPopups(
      this.popups.map(p => {
        if (popupMatches(settings, p)) {
          return {
            ...p,
            content: {
              ...p.content,
              pickInfo
            }
          };
        }
        return p;
      })
    );
  }

  push({ layerId, content, type }: Omit<PopupSettings, 'visible' | 'highlighted'>) {
    this.setPopups([
      ...this.popups,
      { layerId, content, type, position: 'map', highlighted: null, visible: true }
    ]);
  }

  remove(settings: PopupSettings) {
    this.splicePopup(settings);
  }

  removeByLayer(layerId: string) {
    this.setPopups(this.popups.filter(i => i.layerId !== layerId));
  }

  removeByType(type: PopupType) {
    this.setPopups(this.popups.filter(i => i.type !== type));
  }

  removeByPosition(position: PopupPosition) {
    this.setPopups(this.popups.filter(i => i.position !== position));
  }

  resetHighlighteds(type: PopupType) {
    this.setPopups(
      this.popups.map(i => {
        return i.highlighted === type ? { ...i, highlighted: null } : i;
      })
    );
  }

  splicePopup(popup: PopupSettings): PopupSettings {
    const idx = this.popups.findIndex(p => popupMatches(popup, p));
    if (idx < 0) {
      throw new Error('Popup not found');
    }
    return this.popups.splice(idx, 1)[0];
  }

  togglePosition(settings: PopupSettings, force?: PopupPosition) {
    const popup = this.splicePopup(settings);
    const position = force ? force : popup.position === 'map' ? 'right-side' : 'map';
    this.popups.push({ ...popup, highlighted: null, position });
  }

  toggleType(settings: PopupSettings, force?: PopupType) {
    const popup = this.splicePopup(settings);
    const type = force ? force : popup.type === 'onClick' ? 'onHover' : 'onClick';
    this.popups.push({ ...popup, type });
  }

  setHighlight(settings: PopupSettings, val: PopupType | null) {
    this.setPopups(
      this.popups.map(p => {
        if (popupMatches(p, settings)) {
          return { ...p, highlighted: val };
        }
        return p;
      })
    );
  }

  resetTimeout(key: string) {
    const timeout = this.timeoutTracker[key];
    if (timeout) {
      clearTimeout(timeout);
      this.timeoutTracker[key] = null;
    }
  }

  getPopup(layerId: string, index: number) {
    return this.popups.find(p => p.content.index === index && p.layerId === layerId);
  }

  moveToTop(popup: PopupSettings) {
    const found = this.splicePopup(popup);
    this.popups.push(found);
  }

  onClick(content: PopupContent, layerId: string) {
    this.resetTimeout('hoverUpdate');
    this.resetTimeout('hover');
    this.lastHovered = null;

    const found = this.getPopup(layerId, content.index);

    // if not created before, hardly happens because probably it exists from hover
    if (!found) {
      this.resetHighlighteds('onClick');

      this.push({
        layerId,
        content,
        position: 'map',
        type: 'onClick'
      });
    } else {
      // if popup is found, then we must know if its type onHover or not
      if (found.type === 'onHover') {
        this.updatePopupInfo(found, content.pickInfo); // we  update positon of the popup
        this.toggleType(found, 'onClick'); // and turn the popup into a onClick popup
      } else if (found.type === 'onClick') {
        // if it's already type onClick and position is map...
        if (found.position === 'map') {
          this.remove(found); // we remove it
        } else if (found.position === 'right-side') {
          // otherwise we highlight it
          this.setHighlight(found, found.highlighted !== 'onClick' ? 'onClick' : null);

          this.resetTimeout('clickHighlight');
          this.timeoutTracker.clickHighlight = setTimeout(() => {
            this.setHighlight(found, null);
          }, POPUP_HIGHLIGHT_DURATION);
        }
      }
    }
  }

  onHover(content: PopupContent | null, layerId: string) {
    if (!content) {
      this.lastHovered = null;
      this.removeByType('onHover');
      this.resetHighlighteds('onClick');
      this.resetHighlighteds('onHover');
    } else {
      const found = this.getPopup(layerId, content.index);

      if (!found) {
        if (this.lastHovered?.[0] !== layerId || this.lastHovered?.[1].index !== content.index) {
          this.removeByType('onHover');
          this.resetHighlighteds('onHover');
          this.resetTimeout('hover');
          this.timeoutTracker.hover = setTimeout(() => {
            const content = this.lastHovered?.[1];
            if (content) {
              this.push({
                layerId,
                content,
                position: 'map',
                type: 'onHover'
              });
            }
          }, POPUP_DELAY);
        }
        this.lastHovered = [layerId, content];
      } else {
        if (found.position === 'map') {
          if (found.type === 'onHover') {
            this.resetTimeout('hoverUpdate');
            this.timeoutTracker.hoverUpdate = setTimeout(() => {
              this.updatePopupInfo(found, content.pickInfo); // update position of popup
            }, POPUP_DELAY);
          }
        } else if (found.position === 'right-side') {
          if (found.highlighted !== 'onClick') {
            // do a loop for others being de-highlighted
            this.popups.forEach(p => {
              if (p.position === 'right-side' && p.content.index !== found.content.index) {
                this.setHighlight(p, 'onHover');
              }
            });
          }
        }
      }
    }
  }
}
