import isEqual from 'lodash/isEqual';
import { NumberSizeMap } from '../maps/sizeMaps';
import { DIMENSIONS } from '../visualizers';
import { TapefileAccessor, VisualizerModule } from './common';
export default class SizeModule extends VisualizerModule {
    constructor(params) {
        super(params);
    }
    compose(params, visualizer) {
        var _a, _b;
        const changed = this.updateSettings((_b = (_a = this.info.settings) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : {});
        const sizeClause = this.getClause();
        if (!params.props.updateTriggers) {
            params.props.updateTriggers = {};
        }
        const accessor = this.updateAccessor(changed, visualizer);
        let updateTriggers;
        const { units, minPixels = DIMENSIONS.SIZE_MIN_PIXELS, maxPixels = DIMENSIONS.SIZE_MAX_PIXELS } = sizeClause !== null && sizeClause !== void 0 ? sizeClause : { units: 'pixels' };
        switch (params.type.layerName) {
            case 'ScatterplotLayer':
                params.props.getRadius = accessor;
                params.props.radiusUnits = units;
                if (units == 'meters') {
                    params.props.radiusMaxPixels = maxPixels;
                    params.props.radiusMinPixels = minPixels;
                }
                updateTriggers = ['getRadius'];
                break;
            case 'PathLayer':
            case 'LineLayer':
            case 'ArcLayer':
                params.props.getWidth = accessor;
                params.props.widthUnits = units;
                if (units == 'meters') {
                    params.props.widthMaxPixels = maxPixels;
                    params.props.widthMinPixels = minPixels;
                }
                updateTriggers = ['getWidth'];
                break;
            case 'PolygonLayer':
                params.props.getLineWidth = accessor;
                params.props.lineWidthUnits = units;
                if (units === 'meters') {
                    params.props.lineWidthMaxPixels = maxPixels;
                    params.props.lineWidthMinPixels = minPixels;
                }
                updateTriggers = ['getLineWidth'];
                break;
            default:
                params.props.getWidth = accessor;
                updateTriggers = ['getWidth'];
        }
        for (const trigger of updateTriggers) {
            params.props.updateTriggers[trigger] = [this.currentSettings];
        }
        return params;
    }
    getClause() {
        var _a;
        const size = (_a = this.info.settings) === null || _a === void 0 ? void 0 : _a.size;
        if (size === null || size === void 0 ? void 0 : size.static)
            return size.static;
        if (size === null || size === void 0 ? void 0 : size.byValue)
            return size.byValue;
        return null;
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
        var _a;
        if ((_a = clause === null || clause === void 0 ? void 0 : clause.byValue) === null || _a === void 0 ? void 0 : _a.attribute) {
            const sizeMap = new NumberSizeMap({
                sizes: clause.byValue.sizes
            });
            const accessor = new TapefileAccessor(sizeMap);
            visualizer.requestTapefile(clause.byValue.attribute, t => {
                accessor.setTapefile(t);
            });
            return (d) => accessor.getValue(d.idx);
        }
        if (clause === null || clause === void 0 ? void 0 : clause.static) {
            return clause.static.size;
        }
        return DIMENSIONS.SIZE;
    }
}
