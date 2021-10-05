import { getTapefiles } from '@/visualizers/tapefile';
import { ComposableVisualizerInfo } from '@/visualizers/VisualizerInfo';
import { parsePropertyString, propertyString } from '@//utils';
import { ArcLayer, PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { BaseVisualizer } from './visualizers';
import { LineTopologyGetter, PointTopologyGetter, PolygonTopologyGetter } from './geometry';
import { ColorModule, PopupModule } from './visualizerModules';
import SizeModule from './visualizerModules/SizeModule';
class ComposableVisualizer extends BaseVisualizer {
    constructor(config) {
        super(config);
        this.attributes = {};
        this.tapefiles = {};
        this.modules = null;
    }
    mustReload() {
        return true;
    }
    async doLoad() {
        if (!this.topology) {
            this.topology = (await this.topologyGetter.getTopology());
        }
        this.compose();
        await this.ensureTapefiles();
        this.distributeTapefiles();
    }
    compose() {
        this.attributes = {};
        const modules = this.ensureModules();
        let props = this.getDefaultParams();
        for (const mod of modules) {
            props = mod.compose(props, this);
        }
        return props;
    }
    ensureModules() {
        if (!this.modules) {
            this.modules = this.getModules();
        }
        return this.modules;
    }
    setInfo(info) {
        if (!(info instanceof ComposableVisualizerInfo)) {
            throw new Error('unsupported VisualizerInfo');
        }
        super.setInfo(info);
        if (this.modules) {
            this.modules.forEach(m => m.setInfo(info));
        }
    }
    requestTapefile(attribute, onLoad) {
        const key = propertyString(attribute);
        if (!this.attributes[key]) {
            this.attributes[key] = [];
        }
        this.attributes[key].push(onLoad);
    }
    async ensureTapefiles() {
        const toDownload = Object.keys(this.attributes).filter(attr => !this.tapefiles[attr]);
        if (toDownload.length) {
            const properties = toDownload.map(s => parsePropertyString(s));
            const tapefiles = await getTapefiles({
                store: this.datasetStore,
                entityGroup: this.info.entityGroup,
                properties
            });
            for (const [idx, key] of toDownload.entries()) {
                this.tapefiles[key] = tapefiles[idx];
            }
        }
    }
    distributeTapefiles() {
        for (const key of Object.keys(this.attributes)) {
            for (const callback of this.attributes[key]) {
                callback(this.tapefiles[key]);
            }
        }
    }
    updateTimestamp(timestamp) {
        for (const tapefile of Object.values(this.tapefiles)) {
            tapefile.moveTo(timestamp);
        }
    }
    getLayer(timestamp) {
        this.updateTimestamp(timestamp);
        const layerParams = this.compose();
        this.distributeTapefiles();
        for (const triggers of Object.values(layerParams.props.updateTriggers)) {
            triggers.push(timestamp);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new layerParams.type(layerParams.props);
    }
}
export class ComposablePointVisualizer extends ComposableVisualizer {
    getModules() {
        return this.info instanceof ComposableVisualizerInfo
            ? getCommonModules(this.info)
            : [];
    }
    get topologyGetter() {
        return new PointTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getDefaultParams() {
        var _a;
        return {
            type: ScatterplotLayer,
            props: {
                id: this.orderedId,
                data: (_a = this.topology) !== null && _a !== void 0 ? _a : [],
                visible: this.info.visible,
                opacity: 0.9,
                getPosition: (d) => d.coordinates,
                parameters: {
                    depthTest: false
                },
                updateTriggers: {}
            }
        };
    }
}
export class ComposableLineVisualizer extends ComposableVisualizer {
    get topologyGetter() {
        return new LineTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getModules() {
        return this.info instanceof ComposableVisualizerInfo
            ? getCommonModules(this.info)
            : [];
    }
    getDefaultParams() {
        return {
            type: PathLayer,
            props: {
                id: this.orderedId,
                data: this.topology,
                rounded: true,
                visible: this.info.visible,
                getPath: (d) => d.coordinates,
                parameters: {
                    depthTest: false
                },
                updateTriggers: {}
            }
        };
    }
}
export class ComposablePolygonVisualizer extends ComposableVisualizer {
    get topologyGetter() {
        return new PolygonTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getModules() {
        return this.info instanceof ComposableVisualizerInfo
            ? getCommonModules(this.info)
            : [];
    }
    getDefaultParams() {
        return {
            type: PolygonLayer,
            props: {
                id: this.orderedId,
                data: this.topology,
                lineJointRounded: true,
                visible: this.info.visible,
                getPolygon: (d) => d.coordinates,
                parameters: {
                    depthTest: false
                },
                updateTriggers: {}
            }
        };
    }
}
export class ComposableArcVisualizer extends ComposableLineVisualizer {
    getDefaultParams() {
        return {
            type: ArcLayer,
            props: {
                id: this.orderedId,
                data: this.topology,
                visible: this.info.visible,
                getHeight: 0.5,
                getSourcePosition: (d) => d.coordinates[0],
                getTargetPosition: (d) => {
                    return d.coordinates[d.coordinates.length - 1];
                },
                parameters: {
                    depthTest: false
                },
                updateTriggers: {}
            }
        };
    }
}
function getCommonModules(info) {
    return [
        new ColorModule({ info }),
        new PopupModule({ info }),
        new SizeModule({ info })
    ];
}
