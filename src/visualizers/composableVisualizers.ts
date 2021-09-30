import { getTapefiles, SinglePropertyTapefile } from '@/flow/src/visualizers/tapefile';
import { AnyVisualizerInfo, ComposableVisualizerInfo } from '@/flow/src/visualizers/VisualizerInfo';
import { Layer } from '@deck.gl/core';
import {
  ComponentProperty,
  Coordinate,
  EntityGroupData,
  LayerConstructor,
  LayerParams,
  LineCoordinate,
  LineGeometryData,
  PointCoordinate,
  PointGeometryData,
  PolygonCoordinate,
  PolygonGeometryData,
  TopologyLayerData,
  VisualizableDataTypes,
  VisualizerCallbacks
} from '@/flow/src/types';
import { parsePropertyString, propertyString } from '@/flow/src//utils';
import { ArcLayer, PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { BaseVisualizer, VisualizerContext } from './visualizers';
import { LineTopologyGetter, PointTopologyGetter, PolygonTopologyGetter } from './geometry';
import { ColorModule, PopupModule, VisualizerModule } from './visualizerModules';
import SizeModule from './visualizerModules/SizeModule';

abstract class ComposableVisualizer<
    EntityData extends EntityGroupData<Coordinate | number>,
    Coord extends Coordinate,
    LData extends TopologyLayerData<Coord>,
    Layer_ extends Layer<LData>
  >
  extends BaseVisualizer<EntityData, Coordinate, LData, Layer_>
  implements VisualizerCallbacks {
  attributes: Record<string, ((t: SinglePropertyTapefile<VisualizableDataTypes>) => void)[]>;
  tapefiles: Record<string, SinglePropertyTapefile<VisualizableDataTypes>>;
  topology?: LData[];
  modules: VisualizerModule<Coord, LData>[] | null;

  constructor(config: VisualizerContext) {
    super(config);
    this.attributes = {};
    this.tapefiles = {};
    this.modules = null;
  }
  abstract getModules(): VisualizerModule<Coord, LData>[];

  abstract getDefaultParams(): LayerParams<LData, Coord>;

  mustReload(): boolean {
    return true;
  }

  async doLoad() {
    if (!this.topology) {
      this.topology = (await this.topologyGetter.getTopology()) as LData[];
    }
    this.compose();
    await this.ensureTapefiles();
    this.distributeTapefiles();
  }

  private compose(): LayerParams<LData, Coord> {
    this.attributes = {};
    const modules = this.ensureModules();
    let props = this.getDefaultParams();
    for (const mod of modules) {
      props = mod.compose(props, this);
    }
    return props;
  }

  ensureModules(): VisualizerModule<Coord, LData>[] {
    if (!this.modules) {
      this.modules = this.getModules();
    }
    return this.modules;
  }

  setInfo(info: AnyVisualizerInfo) {
    if (!(info instanceof ComposableVisualizerInfo)) {
      throw new Error('unsupported VisualizerInfo');
    }
    super.setInfo(info);

    if (this.modules) {
      this.modules.forEach(m => m.setInfo(info));
    }
  }

  requestTapefile(
    attribute: ComponentProperty,
    onLoad: (t: SinglePropertyTapefile<VisualizableDataTypes>) => void
  ) {
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
      const tapefiles = await getTapefiles<VisualizableDataTypes>({
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
  updateTimestamp(timestamp: number) {
    for (const tapefile of Object.values(this.tapefiles)) {
      tapefile.moveTo(timestamp);
    }
  }

  getLayer(timestamp: number) {
    this.updateTimestamp(timestamp);
    const layerParams = this.compose();
    this.distributeTapefiles();
    for (const triggers of Object.values(layerParams.props.updateTriggers)) {
      (triggers as unknown[]).push(timestamp);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new layerParams.type(layerParams.props) as any;
  }
}

export class ComposablePointVisualizer extends ComposableVisualizer<
  PointGeometryData,
  PointCoordinate,
  TopologyLayerData<PointCoordinate>,
  ScatterplotLayer<TopologyLayerData<PointCoordinate>>
> {
  getModules() {
    return this.info instanceof ComposableVisualizerInfo
      ? getCommonModules<PointCoordinate, TopologyLayerData<PointCoordinate>>(this.info)
      : [];
  }
  get topologyGetter(): PointTopologyGetter {
    return new PointTopologyGetter(this.datasetStore, this.info.entityGroup);
  }
  getDefaultParams(): LayerParams<TopologyLayerData<PointCoordinate>, PointCoordinate> {
    return {
      type: ScatterplotLayer as LayerConstructor<TopologyLayerData<PointCoordinate>>,
      props: {
        id: this.orderedId,
        data: this.topology ?? [],
        visible: this.info.visible,
        opacity: 0.9,
        getPosition: (d: TopologyLayerData<PointCoordinate>) => d.coordinates,
        parameters: {
          depthTest: false
        },
        updateTriggers: {}
      }
    };
  }
}

export class ComposableLineVisualizer extends ComposableVisualizer<
  LineGeometryData,
  LineCoordinate,
  TopologyLayerData<LineCoordinate>,
  PathLayer<TopologyLayerData<LineCoordinate>>
> {
  get topologyGetter(): LineTopologyGetter {
    return new LineTopologyGetter(this.datasetStore, this.info.entityGroup);
  }
  getModules() {
    return this.info instanceof ComposableVisualizerInfo
      ? getCommonModules<LineCoordinate, TopologyLayerData<LineCoordinate>>(this.info)
      : [];
  }

  getDefaultParams(): LayerParams<TopologyLayerData<LineCoordinate>, LineCoordinate> {
    return {
      type: PathLayer as LayerConstructor<TopologyLayerData<LineCoordinate>>,
      props: {
        id: this.orderedId,
        data: this.topology,
        rounded: true,
        visible: this.info.visible,
        getPath: (d: TopologyLayerData<LineCoordinate>) => d.coordinates,
        parameters: {
          depthTest: false
        },
        updateTriggers: {}
      }
    };
  }
}

export class ComposablePolygonVisualizer extends ComposableVisualizer<
  PolygonGeometryData,
  PolygonCoordinate,
  TopologyLayerData<PolygonCoordinate>,
  PolygonLayer<TopologyLayerData<PolygonCoordinate>>
> {
  get topologyGetter(): PolygonTopologyGetter {
    return new PolygonTopologyGetter(this.datasetStore, this.info.entityGroup);
  }
  getModules() {
    return this.info instanceof ComposableVisualizerInfo
      ? getCommonModules<PolygonCoordinate, TopologyLayerData<PolygonCoordinate>>(this.info)
      : [];
  }

  getDefaultParams() {
    return {
      type: PolygonLayer as LayerConstructor<TopologyLayerData<PolygonCoordinate>>,
      props: {
        id: this.orderedId,
        data: this.topology,
        lineJointRounded: true,
        visible: this.info.visible,
        getPolygon: (d: TopologyLayerData<PolygonCoordinate>) => d.coordinates,
        parameters: {
          depthTest: false
        },
        updateTriggers: {}
      }
    };
  }
}

export class ComposableArcVisualizer extends ComposableLineVisualizer {
  getDefaultParams(): LayerParams<TopologyLayerData<LineCoordinate>, LineCoordinate> {
    return {
      type: ArcLayer as LayerConstructor<TopologyLayerData<LineCoordinate>>,
      props: {
        id: this.orderedId,
        data: this.topology,
        visible: this.info.visible,
        getHeight: 0.5,
        getSourcePosition: (d: TopologyLayerData<LineCoordinate>) => d.coordinates[0],
        getTargetPosition: (d: TopologyLayerData<LineCoordinate>) => {
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

function getCommonModules<Coord extends Coordinate, LData extends TopologyLayerData<Coord>>(
  info: ComposableVisualizerInfo
): VisualizerModule<Coord, LData>[] {
  return [
    new ColorModule<Coord, LData>({ info }),
    new PopupModule<Coord, LData>({ info }),
    new SizeModule<Coord, LData>({ info })
  ];
}
