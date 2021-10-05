import { ByValueSizeClause, Coordinate, LayerParams, StaticSizeClause, TopologyLayerData, VisualizerCallbacks } from '@/types';
import { VisualizerModule, VisualizerModuleParams } from './common';
declare type SizeAccessor<D> = ((d: D) => number) | number;
export default class SizeModule<Coord extends Coordinate, LData extends TopologyLayerData<Coord>> extends VisualizerModule<Coord, LData> {
    accessor?: SizeAccessor<LData>;
    currentSettings?: {
        static?: StaticSizeClause;
        byValue?: ByValueSizeClause;
    };
    constructor(params: VisualizerModuleParams);
    compose(params: LayerParams<LData, Coord>, visualizer: VisualizerCallbacks): LayerParams<LData, Coord, any>;
    getClause(): ByValueSizeClause | StaticSizeClause | null;
    /**
     * Updates current settings. returns true when values have changed, otherwise false
     * @param settings
     */
    private updateSettings;
    private updateAccessor;
    private getAccessor;
}
export {};
