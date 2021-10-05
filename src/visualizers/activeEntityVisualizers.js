import { LayerKind } from '@/types';
import { ScatterplotLayer } from '@deck.gl/layers';
import { PointTopologyFromStateGetter } from '@/visualizers/geometry';
import { getTapefiles } from '@/visualizers/tapefile';
import { BaseVisualizer, DIMENSIONS } from '@/visualizers/visualizers';
export class ActivePointVisualizer extends BaseVisualizer {
    get topologyGetter() {
        return new PointTopologyFromStateGetter(this.datasetStore, this.info.entityGroup);
    }
    async doLoad() {
        this.topology = await this.topologyGetter.getTopology();
        const tapefiles = await getTapefiles({
            store: this.datasetStore,
            entityGroup: this.info.entityGroup,
            properties: [
                this.settings().property,
                this.settings().onHover
            ]
        });
        this.toggleData = tapefiles[0];
        this.onHoverData = tapefiles[1];
    }
    getDataForTimestamp(timestamp) {
        if (!this.toggleData || !this.onHoverData || !this.topology) {
            throw new Error('No data available');
        }
        this.toggleData.moveTo(timestamp);
        this.onHoverData.moveTo(timestamp);
        const rv = [];
        const toggles = this.toggleData.copyState();
        const hoverData = this.onHoverData.copyState();
        const activeWhen = !this.settings().inverted;
        for (const entity of this.topology) {
            const toggle = toggles[entity.idx];
            if (toggle === null || Boolean(toggle) != activeWhen) {
                continue;
            }
            entity.onHoverText = hoverData[entity.idx];
            rv.push(entity);
        }
        return rv;
    }
    getLayer(timestamp) {
        if (this.kind == LayerKind.ACTIVE_ENTITY) {
            return new ScatterplotLayer({
                id: this.orderedId,
                data: this.getDataForTimestamp(timestamp),
                pickable: true,
                opacity: 0.9,
                stroked: false,
                filled: true,
                radiusScale: DIMENSIONS.RADIUS_SCALE_DEPRECATED,
                radiusMinPixels: DIMENSIONS.RADIUS_MIN_PIXELS_DEPRECATED,
                radiusMaxPixels: DIMENSIONS.RADIUS_MAX_PIXELS_DEPRECATED,
                getPosition: d => d.coordinates,
                getRadius: 7,
                getFillColor: this.settings().color,
                visible: this.info.visible
            });
        }
        throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
    }
}
