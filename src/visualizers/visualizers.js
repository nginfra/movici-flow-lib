import { LayerKind } from '@/types';
import { hasOwnProperty } from '@/utils';
export const DIMENSIONS = {
    SIZE: 3.5,
    SIZE_MIN_PIXELS: 2,
    SIZE_MAX_PIXELS: 5,
    RADIUS_DEPRECATED: 15,
    RADIUS_MIN_PIXELS_DEPRECATED: 2,
    RADIUS_MAX_PIXELS_DEPRECATED: 10,
    RADIUS_SCALE_DEPRECATED: 2
};
export class BaseVisualizer {
    constructor(config) {
        this.datasetStore = config.datasetStore;
        this.info = config.info;
        this.onLoad = config.onLoad;
        this.onError = config.onError;
        this.order = 0;
        this.loaded = false;
        this.onClick = () => { };
        this.onHover = () => { };
    }
    get baseID() {
        return `${this.info.id}`;
    }
    get kind() {
        if (hasOwnProperty(this.info.settings, 'kind')) {
            return this.info.settings.kind;
        }
        return LayerKind.UNKNOWN;
    }
    get orderedId() {
        return `${this.info.id}-${this.order}`;
    }
    get priority() {
        const layerOrder = [LayerKind.HEAT_MAP, LayerKind.UNKNOWN];
        return layerOrder.indexOf(this.kind);
    }
    async load(callbacks) {
        if (this.mustReload()) {
            this.info.unsetError('load');
            try {
                await this.doLoad(callbacks === null || callbacks === void 0 ? void 0 : callbacks.onProgress);
            }
            catch (err) {
                const error = new Error(String(err));
                console.error(error);
                return this.handleError(error, callbacks === null || callbacks === void 0 ? void 0 : callbacks.onError);
            }
            finally {
                this.loaded = true;
            }
            this.handleSuccess(callbacks === null || callbacks === void 0 ? void 0 : callbacks.onSuccess);
        }
    }
    mustReload() {
        return !this.loaded;
    }
    settings() {
        return this.info.settings;
    }
    setInfo(info) {
        this.info = info;
    }
    setLayerOrder(order) {
        this.order = order;
    }
    setCallbacks(callbacks) {
        this.onClick = callbacks.onClick || this.onClick;
        this.onHover = callbacks.onHover || this.onHover;
    }
    handleSuccess(callback) {
        this.onLoad && this.onLoad();
        callback && callback();
    }
    handleError(err, callback) {
        this.info.setError('load', err.message);
        if (this.onError) {
            this.onError(err);
        }
        if (callback) {
            callback(err);
        }
    }
}
