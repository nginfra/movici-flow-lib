import { ComposableVisualizerInfo } from './VisualizerInfo';
import { Layer } from '@deck.gl/core';
import {
  ComponentProperty,
  Coordinate,
  EntityGroupData,
  ITapefile,
  LayerConstructor,
  LayerParams,
  LineCoordinate,
  LineGeometryData,
  PointCoordinate,
  PointGeometryData,
  PolygonCoordinate,
  PolygonGeometryData,
  TopologyLayerData,
  IVisualizer
} from '../types';
import { parsePropertyString, propertyString } from '..//utils';
import { ArcLayer, PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import ShapeIconLayer from './layers/ShapeIconLayer';
import { BaseVisualizer, VisualizerContext } from './visualizers';
import { LineTopologyGetter, PointTopologyGetter, PolygonTopologyGetter } from './geometry';
import {
  ColorModule,
  PopupModule,
  ShapeModule,
  VisualizerModule,
  SizeModule,
  VisibilityModule,
  IconModule,
  RenderOrderModule
} from './visualizerModules';
import { isError } from 'lodash';

abstract class ComposableVisualizer<
    EntityData extends EntityGroupData<Coordinate | number>,
    Coord extends Coordinate,
    LData extends TopologyLayerData<Coord>,
    Layer_ extends Layer<LData>
  >
  extends BaseVisualizer<EntityData, Coordinate, LData, Layer_>
  implements IVisualizer
{
  attributes: Record<string, ((t: ITapefile<unknown>) => void)[]>;
  tapefiles: Record<string, ITapefile<unknown>>;
  declare topology?: LData[];
  modules: VisualizerModule<Coord, LData>[] | null;
  layerParams: LayerParams<LData, Coord> | null = null;
  forceRenderCounter: number;
  forceUpdateTriggerCounter: number;
  timestamp?: number;
  constructor(config: VisualizerContext) {
    super(config);
    this.attributes = {};
    this.tapefiles = {};
    this.modules = null;
    this.forceRenderCounter = 0;
    this.forceUpdateTriggerCounter = 0;
  }

  abstract getModules(): VisualizerModule<Coord, LData>[];

  abstract getDefaultParams(): LayerParams<LData, Coord>;

  mustReload(): boolean {
    return true;
  }

  async doLoad() {
    // this.layerParams may be null, but only if we start the ComposableVisualizer with an
    // invisible layer. Once the layer becomes visible, we download the required data and set
    // this.layerParams. When it is then toggled invisible again, we set the new layer to be
    // invisible, and don't download any newly required data, until the layer is toggled visible
    // again
    if (this.info.visible) {
      this.topology ??= (await this.topologyGetter.getTopology()) as LData[];
      this.layerParams = this.compose();
      await this.ensureTapefiles();
      this.distributeTapefiles();
    } else if (this.layerParams !== null) {
      this.layerParams = this.compose();
    }
  }

  private compose(): LayerParams<LData, Coord> | null {
    this.info.unsetError('compose');

    try {
      this.attributes = {};
      const modules = this.ensureModules();
      let props = this.getDefaultParams();
      for (const mod of modules) {
        props = mod.compose(props, this);
      }
      return props;
    } catch (e) {
      this.info.setError('compose', isError(e) ? e.message : String(e));
      return null;
    }
  }

  ensureModules(): VisualizerModule<Coord, LData>[] {
    if (!this.modules) {
      this.modules = this.getModules();
    }
    return this.modules;
  }

  setInfo(info: ComposableVisualizerInfo) {
    if (!(info instanceof ComposableVisualizerInfo)) {
      throw new Error('unsupported VisualizerInfo');
    }
    super.setInfo(info);

    if (this.modules) {
      this.modules.forEach(m => m.setInfo(info));
    }
  }

  requestTapefile(attribute: ComponentProperty, onLoad: (t: ITapefile<unknown>) => void) {
    const key = propertyString(attribute);
    if (!this.attributes[key]) {
      this.attributes[key] = [];
    }
    this.attributes[key].push(onLoad);
  }

  async ensureTapefiles() {
    const toDownload = Object.keys(this.attributes).filter(attr => !this.tapefiles[attr]);
    if (toDownload.length) {
      const tapefiles = await this.tapefileStore.getTapefiles<unknown>({
        store: this.datasetStore,
        entityGroup: this.info.entityGroup,
        attributes: toDownload.map(s => parsePropertyString(s)),
        status: this.info.status
      });
      for (const [idx, key] of toDownload.entries()) {
        this.tapefiles[key] = tapefiles[idx];
        tapefiles[idx].onData(ts => {
          if (ts <= (this.timestamp ?? 0)) {
            this.forceUpdateTriggers();
          }
        });
      }
    } else if (this.info.status) {
      const id = this.info.status.register(['initData', 'updates']);
      this.info.status.updateProgress(id, 'initData', 100);
      this.info.status.updateProgress(id, 'updates', 100);
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
    this.timestamp = timestamp;
    for (const tapefile of Object.values(this.tapefiles)) {
      tapefile.moveTo(timestamp);
    }
  }

  /**
   * Call this function to force a full rerender of the layer, next time it is rendered
   */
  forceRender() {
    this.forceRenderCounter++;
  }

  /**
   * Call this function to force re-evaluating all accessors, next time the layer is rendered
   */
  forceUpdateTriggers() {
    this.forceUpdateTriggerCounter++;
  }

  getLayer(timestamp: number, forceRender = false) {
    if (!this.layerParams) {
      return null;
    }

    if (this.info.visible) {
      this.updateTimestamp(timestamp);
    }

    forceRender && this.forceRender();

    const layerParams = this.appendUpdateTriggers(
      this.layerParams,
      this.info.visible ? timestamp : null,
      true
    );
    this.appendUpdateTriggers(layerParams, this.forceUpdateTriggerCounter);

    layerParams.props.id += ':' + this.forceRenderCounter;
    return new layerParams.type(layerParams.props) as unknown as Layer_;
  }

  appendUpdateTriggers(params: LayerParams<LData, Coord>, value: unknown, copy = false) {
    if (copy) {
      params = {
        type: params.type,
        props: { ...params.props }
      };
    }
    params.props.updateTriggers = Object.entries(params.props.updateTriggers).reduce(
      (prev, [key, val]) => {
        prev[key] = [...(val as []), value];
        return prev;
      },
      {} as Record<string, unknown>
    );
    return params;
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

export class ComposableIconVisualizer extends ComposableVisualizer<
  PointGeometryData,
  PointCoordinate,
  TopologyLayerData<PointCoordinate>,
  ShapeIconLayer<TopologyLayerData<PointCoordinate>>
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
      type: ShapeIconLayer as LayerConstructor<TopologyLayerData<PointCoordinate>>,
      props: {
        id: this.orderedId,
        data: this.topology ?? [],
        visible: this.info.visible,
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
    new SizeModule<Coord, LData>({ info }),
    new VisibilityModule<Coord, LData>({ info }),
    new IconModule<Coord, LData>({ info }),
    new ShapeModule<Coord, LData>({ info }),
    new RenderOrderModule<Coord, LData>({ info })
  ];
}
