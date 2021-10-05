import { LayerKind } from '@/types';
import { PathLayer, ScatterplotLayer, PolygonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { LineTopologyGetter, PointTopologyGetter, PolygonTopologyGetter } from './geometry';
import { DIMENSIONS, BaseVisualizer } from './visualizers';
export class StaticDatasetVisualizer extends BaseVisualizer {
    constructor(config) {
        super(config);
    }
    async doLoad() {
        this.topology = await this.topologyGetter.getTopology();
    }
}
export class StaticPointVisualizer extends StaticDatasetVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new PointTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer() {
        if (this.kind == LayerKind.STATIC_COLOR) {
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
                getRadius: DIMENSIONS.RADIUS_DEPRECATED,
                getFillColor: this.settings().color,
                visible: this.info.visible
            });
        }
        else if (this.kind === LayerKind.HEAT_MAP) {
            return new HeatmapLayer({
                id: this.orderedId,
                data: this.topology,
                pickable: false,
                opacity: 0.7,
                getPosition: d => d.coordinates,
                visible: this.info.visible
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}
export class StaticLineVisualizer extends StaticDatasetVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new LineTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer() {
        return new PathLayer({
            id: this.orderedId,
            data: this.topology,
            pickable: false,
            widthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
            widthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
            getWidth: DIMENSIONS.SIZE,
            getPath: d => d.coordinates,
            getColor: this.settings().color,
            visible: this.info.visible
        });
    }
}
export class StaticPolygonVisualizer extends StaticDatasetVisualizer {
    constructor(config) {
        super(config);
    }
    get topologyGetter() {
        return new PolygonTopologyGetter(this.datasetStore, this.info.entityGroup);
    }
    getLayer() {
        const fillColor = this.settings().color;
        fillColor[3] = 100;
        return new PolygonLayer({
            id: this.orderedId,
            data: this.topology,
            pickable: false,
            stroked: true,
            extruded: false,
            getPolygon: d => d.coordinates,
            getLineColor: this.settings().color,
            getFillColor: fillColor,
            getLineWidth: DIMENSIONS.SIZE,
            lineWidthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
            lineWidthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
            visible: this.info.visible
        });
    }
}
