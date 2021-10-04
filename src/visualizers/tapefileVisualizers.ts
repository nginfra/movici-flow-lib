import { BaseVisualizer, VisualizerContext, DIMENSIONS } from '@/visualizers/visualizers';
import {
  RGBAColor,
  ColorMapLayerSettings,
  Coordinate,
  EntityGroupData,
  LayerKind,
  LineCoordinate,
  LineGeometryData,
  PointCoordinate,
  PointGeometryData,
  PolygonCoordinate,
  PolygonGeometryData,
  TopologyLayerData
} from '@/types';
import { Layer } from '@deck.gl/core';
import { layerInfoToTapefile, SinglePropertyTapefile } from '@/visualizers/tapefile';
import { PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import {
  LineTopologyGetter,
  PointTopologyGetter,
  PolygonTopologyGetter
} from '@/visualizers/geometry';
import { IntColorMap, NumberColorMap } from '@/visualizers/maps/colorMaps';
import { VisualizerInfo } from '@/visualizers/VisualizerInfo';

function colorMapFromLayerSettings(settings: ColorMapLayerSettings): NumberColorMap {
  return new IntColorMap(settings);
}

export abstract class TapefileVisualizer<
  EntityData extends EntityGroupData<Coordinate | number>,
  PropertyData extends number, // only support single value property data types (ie number) for now
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>,
  Layer_ extends Layer<LData>
> extends BaseVisualizer<EntityData, Coord, LData, Layer_> {
  tapefile: null | SinglePropertyTapefile<PropertyData>;
  state: null | PropertyData[];
  colorMap?: NumberColorMap;

  constructor(config: VisualizerContext) {
    super(config);
    this.tapefile = null;
    this.state = null;
  }

  async doLoad() {
    [this.topology, this.tapefile] = await Promise.all([
      this.topologyGetter.getTopology(),
      layerInfoToTapefile<PropertyData>(
        this.info as VisualizerInfo,
        this.settings<ColorMapLayerSettings>().property,
        this.datasetStore
      )
    ]);
  }

  getColor(obj: LData): RGBAColor {
    if (this.colorMap) {
      const val = this.state ? this.state[obj.idx] : this.colorMap.undefined;
      return this.colorMap.getValue(val);
    } else {
      return [0, 0, 0];
    }
  }
  updateColorMap() {
    const colorSettings = this.settings<ColorMapLayerSettings>();
    this.colorMap = colorMapFromLayerSettings(colorSettings);
  }
  updateEntityData(timestamp: number) {
    if (this.tapefile) {
      this.tapefile.moveTo(timestamp);
      this.state = this.tapefile.copyState();
    }
  }
}

export class TapefilePointVisualizer extends TapefileVisualizer<
  PointGeometryData,
  number,
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

  getLayer(timestamp: number) {
    this.updateEntityData(timestamp);
    if (this.kind == LayerKind.COLOR_MAP) {
      this.updateColorMap();
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

export class TapefileLineVisualizer extends TapefileVisualizer<
  LineGeometryData,
  number,
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

  getLayer(timestamp: number) {
    this.updateEntityData(timestamp);

    if (this.kind == LayerKind.COLOR_MAP) {
      this.updateColorMap();
      return new PathLayer<TopologyLayerData<LineCoordinate>>({
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

export class TapefilePolygonVisualizer extends TapefileVisualizer<
  PolygonGeometryData,
  number,
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

  getFillColor(obj: TopologyLayerData<LineCoordinate>): [number, number, number, number] {
    const [r, g, b] = this.getColor(obj);
    return [r, g, b, 100];
  }
  getLayer(timestamp: number) {
    this.updateEntityData(timestamp);

    if (this.kind == LayerKind.COLOR_MAP) {
      this.updateColorMap();
      return new PolygonLayer<TopologyLayerData<LineCoordinate>>({
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
