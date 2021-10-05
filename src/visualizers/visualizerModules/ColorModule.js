import isEqual from 'lodash/isEqual';
import { NumberColorMap } from '@/visualizers/maps/colorMaps';
import { interpolateColorMapping } from '@//utils/colorUtils';
import { TapefileAccessor, VisualizerModule } from '@/visualizers/visualizerModules/common';
export default class ColorModule extends VisualizerModule {
    constructor(params) {
        super(params);
    }
    compose(params, visualizer) {
        var _a, _b;
        const changed = this.updateSettings((_b = (_a = this.info.settings) === null || _a === void 0 ? void 0 : _a.color) !== null && _b !== void 0 ? _b : {});
        if (!params.props.updateTriggers) {
            params.props.updateTriggers = {};
        }
        const accessor = this.updateAccessor(changed, visualizer);
        let updateTriggers;
        switch (params.type.layerName) {
            case 'ScatterplotLayer':
                params.props.getFillColor = accessor;
                updateTriggers = ['getFillColor'];
                break;
            case 'PolygonLayer':
                params.props.getLineColor = accessor;
                params.props.getFillColor = this.setOpacity(accessor, 80);
                updateTriggers = ['getLineColor', 'getFillColor'];
                break;
            case 'ArcLayer':
                params.props.getSourceColor = accessor;
                params.props.getTargetColor = accessor;
                updateTriggers = ['getSourceColor', 'getTargetColor'];
                break;
            default:
                params.props.getColor = accessor;
                updateTriggers = ['getColor'];
        }
        for (const trigger of updateTriggers) {
            params.props.updateTriggers[trigger] = [this.currentSettings];
        }
        return params;
    }
    /**
     * Updates current settings. returns true when values have changed, otherwise false
     * @param settings
     */
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
        var _a, _b, _c;
        if ((_a = clause === null || clause === void 0 ? void 0 : clause.byValue) === null || _a === void 0 ? void 0 : _a.attribute) {
            const colorMap = new NumberColorMap({
                colors: this.prepareColors(clause.byValue),
                specialColor: (_b = clause.byValue.specialColor) !== null && _b !== void 0 ? _b : [0, 0, 0],
                undefinedColor: (_c = clause.byValue.undefinedColor) !== null && _c !== void 0 ? _c : [0, 0, 0]
            });
            const accessor = new TapefileAccessor(colorMap);
            visualizer.requestTapefile(clause.byValue.attribute, t => {
                accessor.setTapefile(t);
            });
            return (d) => accessor.getValue(d.idx);
        }
        if (clause === null || clause === void 0 ? void 0 : clause.static) {
            return clause.static.color;
        }
        return [0, 0, 0];
    }
    setOpacity(accessor, opacity) {
        if (Array.isArray(accessor)) {
            const rv = [...accessor];
            rv[3] = opacity;
            return rv;
        }
        return (d) => [...accessor(d).slice(0, 3), opacity];
    }
    prepareColors(colorClause) {
        const colors = colorClause.colors;
        if (colors.length < 2 || colorClause.type == 'buckets') {
            return colors;
        }
        const minColors = 20;
        const minInBetween = 5;
        const inBetween = Math.max(minInBetween, Math.ceil((minColors - colors.length) / (colors.length - 1)));
        const rv = [];
        for (let i = 0; i < colors.length - 1; i++) {
            rv.push(colors[i]);
            rv.push(...interpolateColorMapping(colors[i], colors[i + 1], inBetween));
        }
        rv.push(colors[colors.length - 1]);
        return rv;
    }
}
