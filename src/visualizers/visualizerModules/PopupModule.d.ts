/// <reference types="deck.gl" />
import { Coordinate, LayerParams, PopupClause, PopupContent, TopologyLayerData, VisualizerCallbacks } from '@/types';
import { PickInfo } from '@deck.gl/core/lib/deck';
import { SinglePropertyTapefile } from '@/visualizers/tapefile';
import { VisualizerModule, VisualizerModuleParams } from '@/visualizers/visualizerModules/common';
declare type PickingHandler<D> = (info: PickInfo<D>) => boolean;
export default class PopupModule<Coord extends Coordinate, LData extends TopologyLayerData<Coord>> extends VisualizerModule<Coord, LData> {
    accessor: PickingHandler<LData> | null;
    currentSettings: PopupClause | null;
    constructor(params: VisualizerModuleParams);
    compose(params: LayerParams<LData, Coord>, visualizer: VisualizerCallbacks): LayerParams<LData, Coord>;
    private updateSettings;
    private updateAccessor;
    private getAccessor;
}
export declare class PopupContentAccessor {
    private readonly tapefiles;
    private popup;
    constructor(popup: PopupClause);
    setTapefile(tapefile: SinglePropertyTapefile<unknown>, index: number): void;
    getValue(index: number, pickInfo: PickInfo<unknown>): PopupContent;
}
export {};
