import { SinglePropertyTapefile } from '@/visualizers/tapefile';
import { Coordinate, LayerParams, Mapper, TopologyLayerData, VisualizerCallbacks } from '@/types';
import { ComposableVisualizerInfo } from '@/visualizers/VisualizerInfo';
export declare type VisualizerModuleParams = {
    info: ComposableVisualizerInfo;
};
export declare abstract class VisualizerModule<Coord extends Coordinate, LData extends TopologyLayerData<Coord>> {
    info: ComposableVisualizerInfo;
    constructor(params: VisualizerModuleParams);
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
    abstract compose(params: LayerParams<LData, Coord>, visualizer: VisualizerCallbacks): LayerParams<LData, Coord>;
    setInfo(info: ComposableVisualizerInfo): void;
}
export declare class TapefileAccessor<In, Out> {
    private tapefile?;
    private mapping;
    constructor(mapping: Mapper<In, Out>, tapefile?: SinglePropertyTapefile<In>);
    setTapefile(tapefile: SinglePropertyTapefile<In>): void;
    getValue(index: number): Out;
}
