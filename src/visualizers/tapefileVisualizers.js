import { BaseVisualizer, DIMENSIONS } from '@/visualizers/visualizers';
import { LayerKind } from '@/types';
import { layerInfoToTapefile } from '@/visualizers/tapefile';
import { PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { LineTopologyGetter, PointTopologyGetter, PolygonTopologyGetter } from '@/visualizers/geometry';
import { IntColorMap } from '@/visualizers/maps/colorMaps';
function colorMapFromLayerSettings(settings) {
    return new IntColorMap(settings);
}
export class TapefileVisualizer extends BaseVisualizer {
    constructor(config) {
        super(config);
        this.tapefile = null;
        this.state = null;
    }
    async doLoad() {
        [this.topology, this.tapefile] = await Promise.all([
            this.topologyGetter.getTopology(),
            layerInfoToTapefile(this.info, this.settings().property, this.datasetStore)
        ]);
    }
    getColor(obj) {
        if (this.colorMap) {
            const val = this.state ? this.state[obj.idx] : this.colorMap.undefined;
            return this.colorMap.getValue(val);
        }
        else {
            return [0, 0, 0];
        }
    }
    updateColorMap() {
        const colorSettings = this.settings();
        this.colorMap = colorMapFromLayerSettings(colorSettings);
    }
    updateEntityData(timestamp) {
        if (this.tapefile) {
            this.tapefile.moveTo(timestamp);
            this.state = this.tapefile.copyState();
        }
    }
}
export class TapefilePointVisualizer extends TapefileVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new PointTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer(timestamp) {
        this.updateEntityData(timestamp);
        if (this.kind == LayerKind.COLOR_MAP) {
            this.updateColorMap();
            return new ScatterplotLayer({
                id: this.orderedId,
                data: this.topology,
                pickable: false,
                opacity: 0.9,
                stroked: false,
                filled: true,
                radiusScale: DIMENSIONS.RADIUS_SCALE_DEPRECATED,
                radiusMinPixels: DIMENSIONS.RADIUS_MIN_PIXELS_DEPRECATED,
                radiusMaxPixels: DIMENSIONS.RADIUS_MAX_PIXELS_DEPRECATED,
                getPosition: d => d.coordinates,
                getRadius: 7,
                getFillColor: this.getColor.bind(this),
                visible: this.info.visible,
                updateTriggers: {
                    getFillColor: [timestamp, this.colorMap]
                }
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}
export class TapefileLineVisualizer extends TapefileVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new LineTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer(timestamp) {
        this.updateEntityData(timestamp);
        if (this.kind == LayerKind.COLOR_MAP) {
            this.updateColorMap();
            return new PathLayer({
                id: this.orderedId,
                data: this.topology,
                pickable: false,
                widthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
                widthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
                getWidth: DIMENSIONS.SIZE,
                getPath: d => d.coordinates,
                getColor: this.getColor.bind(this),
                visible: this.info.visible,
                updateTriggers: {
                    getColor: [timestamp, this.colorMap]
                }
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}
export class TapefilePolygonVisualizer extends TapefileVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new PolygonTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getFillColor(obj) {
        const [r, g, b] = this.getColor(obj);
        return [r, g, b, 100];
    }
    getLayer(timestamp) {
        this.updateEntityData(timestamp);
        if (this.kind == LayerKind.COLOR_MAP) {
            this.updateColorMap();
            return new PolygonLayer({
                id: this.orderedId,
                data: this.topology,
                pickable: false,
                stroked: true,
                extruded: false,
                getPolygon: d => d.coordinates,
                getLineColor: this.getColor.bind(this),
                getFillColor: this.getFillColor.bind(this),
                getLineWidth: DIMENSIONS.SIZE,
                lineWidthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
                lineWidthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
                visible: this.info.visible,
                updateTriggers: {
                    getLineColor: [timestamp, this.colorMap],
                    getFillColor: [timestamp, this.colorMap]
                }
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}
