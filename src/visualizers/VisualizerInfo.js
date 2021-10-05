import { LayerKind, VisualizationMode } from '@/types';
import { hasOwnProperty, propertyString } from '@//utils';
import { cleanVisualizerSettings } from '@/visualizers/visualizerHelpers';
class BaseVisualizerInfo {
    constructor(config) {
        var _a, _b, _c, _d, _e;
        this.datasetName = (_a = config === null || config === void 0 ? void 0 : config.datasetName) !== null && _a !== void 0 ? _a : '';
        this.datasetUUID = (_b = config === null || config === void 0 ? void 0 : config.datasetUUID) !== null && _b !== void 0 ? _b : null;
        this.name = (config === null || config === void 0 ? void 0 : config.name) || this.datasetName;
        this.scenarioUUID = (config === null || config === void 0 ? void 0 : config.scenarioUUID) || null;
        this.entityGroup = (_c = config === null || config === void 0 ? void 0 : config.entityGroup) !== null && _c !== void 0 ? _c : '';
        this.mode = (_d = config === null || config === void 0 ? void 0 : config.mode) !== null && _d !== void 0 ? _d : VisualizationMode.GEOMETRY;
        this.visible = (_e = config === null || config === void 0 ? void 0 : config.visible) !== null && _e !== void 0 ? _e : true;
        this.errors = (config === null || config === void 0 ? void 0 : config.errors) || {};
        this.onProgress = config === null || config === void 0 ? void 0 : config.onProgress;
    }
    /**
     * `setError` and `unsetError` must be used to set/unset an error for a specific category (`key`).
     * This is necessary to maintain Vue reactivity on the `errors` object. Errors are given a
     * category so that specific parts of the code can manage their specific error by category
     * (eg. `load` for downloading errors, or `content` for when a `VisualizerInfo` object has invalid
     * content
     * @param key: the error category
     * @param value: the error message
     */
    setError(key, value) {
        this.errors = Object.assign({}, this.errors, { [key]: value });
    }
    /**
     * Unset an error by category (`key`). See also `setError` above
     * @param key: the error category
     */
    unsetError(key) {
        delete this.errors[key];
        this.errors = Object.assign({}, this.errors);
    }
}
export class VisualizerInfo extends BaseVisualizerInfo {
    constructor(config) {
        var _a, _b;
        super(config);
        this.geometry = (_a = config === null || config === void 0 ? void 0 : config.geometry) !== null && _a !== void 0 ? _a : null;
        this.settings = (_b = config === null || config === void 0 ? void 0 : config.settings) !== null && _b !== void 0 ? _b : { kind: LayerKind.UNKNOWN };
    }
    get id() {
        let rv = `${this.settings.kind}-${this.datasetName}/${this.entityGroup}`;
        if (hasOwnProperty(this.settings, 'property') && this.settings.property) {
            rv += '/' + propertyString(this.settings.property);
        }
        if (this.geometry) {
            rv += '-' + this.geometry;
        }
        return rv;
    }
    /**
     * Create a `VisualizerInfo` object from a `VisualizerViewConfig`. This also requires giving the
     * scenario UUID. The `VisualizerInfo` must still be validated for any content errors.
     * @param config: VisualizerViewConfig
     * @param scenarioUUID: A Scenario UUID
     */
    static fromLayerConfig(config, scenarioUUID) {
        return new VisualizerInfo({
            scenarioUUID,
            name: config.name,
            geometry: config.geometry,
            datasetName: config.dataset_name,
            entityGroup: config.entity_group,
            mode: config.mode,
            visible: config.visible,
            settings: cleanVisualizerSettings(config.settings)
        });
    }
}
export class ComposableVisualizerInfo extends BaseVisualizerInfo {
    constructor(config) {
        var _a;
        super(config);
        this.settings = config === null || config === void 0 ? void 0 : config.settings;
        this.id = (_a = config === null || config === void 0 ? void 0 : config.id) !== null && _a !== void 0 ? _a : randomID();
    }
    toVisualizerConfig() {
        if (!this.settings)
            throw new Error(`No settings defined for ${this.name}`);
        return {
            name: this.name,
            dataset_name: this.datasetName,
            entity_group: this.entityGroup,
            visible: this.visible,
            settings: this.settings
        };
    }
}
function randomID() {
    return Math.random().toString(36);
}
