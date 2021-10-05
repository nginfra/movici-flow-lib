import isEqual from 'lodash/isEqual';
import { VisualizerModule } from '@/visualizers/visualizerModules/common';
export default class PopupModule extends VisualizerModule {
    constructor(params) {
        super(params);
        this.currentSettings = null;
        this.accessor = null;
    }
    compose(params, visualizer) {
        var _a, _b, _c, _d;
        const changed = this.updateSettings(((_a = this.info.settings) === null || _a === void 0 ? void 0 : _a.popup) || null), accessor = this.updateAccessor(changed, visualizer), when = (_b = this.currentSettings) === null || _b === void 0 ? void 0 : _b.when, show = (_d = (_c = this.currentSettings) === null || _c === void 0 ? void 0 : _c.show) !== null && _d !== void 0 ? _d : true;
        params.props.pickable = false;
        if (show) {
            if (when) {
                params.props.pickable = true;
                params.props[when] = accessor;
            }
            // to close popup while on hover
            if (when === 'onHover') {
                params.props.onClick = () => {
                    visualizer.onHover(null);
                };
            }
        }
        return params;
    }
    updateSettings(settings) {
        const changed = !isEqual(settings, this.currentSettings);
        if (changed) {
            this.currentSettings = settings;
        }
        return changed;
    }
    updateAccessor(changed, visualizer) {
        if (!changed && this.accessor) {
            return this.accessor;
        }
        this.accessor = this.getAccessor(this.currentSettings, visualizer);
        return this.accessor;
    }
    getAccessor(clause, visualizer) {
        var _a;
        if (!clause || !((_a = clause.show) !== null && _a !== void 0 ? _a : true)) {
            return null;
        }
        const accessor = new PopupContentAccessor(clause);
        for (const [idx, item] of clause.items.entries()) {
            visualizer.requestTapefile(item.attribute, t => {
                accessor.setTapefile(t, idx);
            });
        }
        // TODO fix typing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (info) => {
            if (info && info.object) {
                visualizer[clause.when](accessor.getValue(info.object.idx, info));
            }
            else {
                visualizer[clause.when](null);
            }
            return true;
        };
    }
}
export class PopupContentAccessor {
    constructor(popup) {
        this.tapefiles = new Array(popup.items.length);
        this.popup = popup;
    }
    setTapefile(tapefile, index) {
        if (index >= this.tapefiles.length) {
            throw new Error('Tapefile assignment out of bounds');
        }
        this.tapefiles[index] = tapefile;
    }
    getValue(index, pickInfo) {
        return {
            title: this.popup.title,
            pickInfo,
            when: this.popup.when,
            position: this.popup.position,
            items: this.popup.items.map((item, idx) => {
                return {
                    name: item.name,
                    attribute: item.attribute,
                    tapefile: this.tapefiles[idx]
                };
            }),
            index
        };
    }
}
