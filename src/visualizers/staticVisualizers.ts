import {
  Coordinate,
  EntityGroupData,
  LayerKind,
  LineCoordinate,
  LineGeometryData,
  PointCoordinate,
  PointGeometryData,
  PolygonCoordinate,
  PolygonGeometryData,
  StaticColorLayerSettings,
  TopologyLayerData
} from '@/flow/src/types';
import { PathLayer, ScatterplotLayer, PolygonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { LineTopologyGetter, PointTopologyGetter, PolygonTopologyGetter } from './geometry';
import { Layer } from '@deck.gl/core';
import { DIMENSIONS, BaseVisualizer, VisualizerContext } from './visualizers';

export abstract class StaticDatasetVisualizer<
  EntityData extends EntityGroupData<Coordinate | number>,
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>,
  Layer_ extends Layer<LData>
> extends BaseVisualizer<EntityData, Coord, LData, Layer_> {
  protected constructor(config: VisualizerContext) {
    super(config);
  }

  async doLoad() {
    this.topology = await this.topologyGetter.getTopology();
  }
}

export class StaticPointVisualizer extends StaticDatasetVisualizer<
  PointGeometryData,
  PointCoordinate,
  TopologyLayerData<PointCoordinate>,
  | ScatterplotLayer<TopologyLayerData<PointCoordinate>>
  | HeatmapLayer<TopologyLayerData<PointCoordinate>>
> {
  constructor(config: VisualizerContext) {
    super(config);
  }

  get topologyGetter(): PointTopologyGetter {
    return new PointTopologyGetter(this.datasetStore, this.info.entityGroup);
  }

  getLayer() {
    if (this.kind == LayerKind.STATIC_COLOR) {
      return new ScatterplotLayer<TopologyLayerData<PointCoordinate>>({
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
        getFillColor: this.settings<StaticColorLayerSettings>().color,
        visible: this.info.visible
      });
    } else if (this.kind === LayerKind.HEAT_MAP) {
      return new HeatmapLayer<TopologyLayerData<PointCoordinate>>({
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

export class StaticLineVisualizer extends StaticDatasetVisualizer<
  LineGeometryData,
  LineCoordinate,
  TopologyLayerData<LineCoordinate>,
  PathLayer<TopologyLayerData<LineCoordinate>>
> {
  constructor(config: VisualizerContext) {
    super(config);
  }

  get topologyGetter(): LineTopologyGetter {
    return new LineTopologyGetter(this.datasetStore, this.info.entityGroup);
  }

  getLayer() {
    return new PathLayer<TopologyLayerData<LineCoordinate>>({
      id: this.orderedId,
      data: this.topology,
      pickable: false,
      widthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
      widthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
      getWidth: DIMENSIONS.SIZE,
      getPath: d => d.coordinates,
      getColor: this.settings<StaticColorLayerSettings>().color,
      visible: this.info.visible
    });
  }
}

export class StaticPolygonVisualizer extends StaticDatasetVisualizer<
  PolygonGeometryData,
  PolygonCoordinate,
  TopologyLayerData<PolygonCoordinate>,
  PolygonLayer<TopologyLayerData<PolygonCoordinate>>
> {
  constructor(config: VisualizerContext) {
    super(config);
  }

  get topologyGetter(): PolygonTopologyGetter {
    return new PolygonTopologyGetter(this.datasetStore, this.info.entityGroup);
  }

  getLayer() {
    const fillColor = this.settings<StaticColorLayerSettings>().color;
    fillColor[3] = 100;

    return new PolygonLayer<TopologyLayerData<LineCoordinate>>({
      id: this.orderedId,
      data: this.topology,
      pickable: false,
      stroked: true,
      extruded: false,
      getPolygon: d => d.coordinates,
      getLineColor: this.settings<StaticColorLayerSettings>().color,
      getFillColor: fillColor,
      getLineWidth: DIMENSIONS.SIZE,
      lineWidthMinPixels: DIMENSIONS.SIZE_MIN_PIXELS,
      lineWidthMaxPixels: DIMENSIONS.SIZE_MAX_PIXELS,
      visible: this.info.visible
    });
  }
}
