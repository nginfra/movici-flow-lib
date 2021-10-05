import { ByValueColorClause, Coordinate, LayerParams, RGBAColor, StaticColorClause, TopologyLayerData, VisualizerCallbacks } from '@/types';
import { VisualizerModule, VisualizerModuleParams } from '@/visualizers/visualizerModules/common';
declare type ColorAccessor<D> = ((d: D) => RGBAColor) | RGBAColor;
export default class ColorModule<Coord extends Coordinate, LData extends TopologyLayerData<Coord>> extends VisualizerModule<Coord, LData> {
    accessor?: ColorAccessor<LData>;
    currentSettings?: {
        static?: StaticColorClause;
        byValue?: ByValueColorClause;
    };
    constructor(params: VisualizerModuleParams);
    compose(params: LayerParams<LData, Coord>, visualizer: VisualizerCallbacks): LayerParams<LData, Coord, any>;
    /**
     * Updates current settings. returns true when values have changed, otherwise false
     * @param settings
     */
    private updateSettings;
    private updateAccessor;
    private getAccessor;
    private setOpacity;
    prepareColors(colorClause: ByValueColorClause): [number, RGBAColor][];
}
export {};
