import { SinglePropertyTapefile } from '../tapefile';
import {
  Coordinate,
  LayerParams,
  Mapper,
  TopologyLayerData,
  IVisualizer
} from '@movici-flow-common/types';
import { ComposableVisualizerInfo } from '../VisualizerInfo';

export type VisualizerModuleParams = { info: ComposableVisualizerInfo };

export abstract class VisualizerModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> {
  info: ComposableVisualizerInfo;

  constructor(params: VisualizerModuleParams) {
    this.info = params.info;
  }

  /**
   * Take in a deckgl Layer type, such as ScatterPlotLayer, and accompanying layerProps. This method
   * modifies the layerProps to reflect a single aspect of AspectComposer.info object (color, size,
   * etc). It can specify what tapefiles it needs to correctly configure the aspects of the Layer.
   * (downloading the tapefiles is deferred to a later point so that all data is downloaded
   * at the same time (and deduplicated)
   *
   * @param params .layerType
   * @param params .layerProps
   * @param visualizer: the owning ComposableVisualizer object, used for requesting tapefiles
   */
  abstract compose(
    params: LayerParams<LData, Coord>,
    visualizer: IVisualizer
  ): LayerParams<LData, Coord>;

  setInfo(info: ComposableVisualizerInfo) {
    this.info = info;
  }
}

export class TapefileAccessor<In, Out> {
  private tapefile?: SinglePropertyTapefile<In>;
  private mapping: Mapper<In, Out>;

  constructor(mapping: Mapper<In, Out>, tapefile?: SinglePropertyTapefile<In>) {
    this.mapping = mapping;
    this.tapefile = tapefile;
  }

  setTapefile(tapefile: SinglePropertyTapefile<In>) {
    this.tapefile = tapefile;
  }

  getValue(index: number): Out {
    if (!this.tapefile) throw new Error('No tapefile defined for accessor');

    return this.mapping.getValue(this.tapefile.data[index]);
  }
}
