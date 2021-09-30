import {
  ActiveEntityLayerSettings,
  Coordinate,
  LayerKind,
  PointCoordinate,
  PointGeometryData,
  TopologyLayerData
} from '@/flow/src/types';
import { ScatterplotLayer } from '@deck.gl/layers';
import { PointTopologyFromStateGetter } from '@/flow/src/visualizers/geometry';
import { getTapefiles, SinglePropertyTapefile } from '@/flow/src/visualizers/tapefile';
import { BaseVisualizer, DIMENSIONS } from '@/flow/src/visualizers/visualizers';

interface ActiveEntityLayerData<Coord extends Coordinate> extends TopologyLayerData<Coord> {
  onHoverText?: string | number;
}

export class ActivePointVisualizer extends BaseVisualizer<
  PointGeometryData,
  PointCoordinate,
  ActiveEntityLayerData<PointCoordinate>,
  ScatterplotLayer<ActiveEntityLayerData<PointCoordinate>>
> {
  toggleData?: SinglePropertyTapefile<boolean>;
  onHoverData?: SinglePropertyTapefile<string | number>;
  declare topology?: ActiveEntityLayerData<PointCoordinate>[];
  get topologyGetter(): PointTopologyFromStateGetter {
    return new PointTopologyFromStateGetter(this.datasetStore, this.info.entityGroup);
  }

  async doLoad(): Promise<void> {
    this.topology = await this.topologyGetter.getTopology();

    const tapefiles = await getTapefiles<unknown>({
      store: this.datasetStore,
      entityGroup: this.info.entityGroup,
      properties: [
        this.settings<ActiveEntityLayerSettings>().property,
        this.settings<ActiveEntityLayerSettings>().onHover
      ]
    });
    this.toggleData = tapefiles[0] as SinglePropertyTapefile<boolean>;
    this.onHoverData = tapefiles[1] as SinglePropertyTapefile<string | number>;
  }

  getDataForTimestamp(timestamp: number) {
    if (!this.toggleData || !this.onHoverData || !this.topology) {
      throw new Error('No data available');
    }
    this.toggleData.moveTo(timestamp);
    this.onHoverData.moveTo(timestamp);
    const rv: ActiveEntityLayerData<PointCoordinate>[] = [];

    const toggles = this.toggleData.copyState();
    const hoverData = this.onHoverData.copyState();
    const activeWhen = !this.settings<ActiveEntityLayerSettings>().inverted;
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

  getLayer(timestamp: number) {
    if (this.kind == LayerKind.ACTIVE_ENTITY) {
      return new ScatterplotLayer<ActiveEntityLayerData<PointCoordinate>>({
        id: this.orderedId,
        data: this.getDataForTimestamp(timestamp),
        pickable: true,
        opacity: 0.9,
        stroked: false,
        filled: true,
        radiusScale: DIMENSIONS.RADIUS_SCALE_DEPRECATED,
        radiusMinPixels: DIMENSIONS.RADIUS_MIN_PIXELS_DEPRECATED,
        radiusMaxPixels: DIMENSIONS.RADIUS_MAX_PIXELS_DEPRECATED,
        getPosition: d => d.coordinates as PointCoordinate,
        getRadius: 7,
        getFillColor: this.settings<ActiveEntityLayerSettings>().color,
        visible: this.info.visible
      });
    }
    throw new Error(`Unsupported layer type '${this.kind}' for layer ${this.orderedId}`);
  }
}
