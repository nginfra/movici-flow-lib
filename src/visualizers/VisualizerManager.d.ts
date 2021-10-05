import { Visualizer } from '@/visualizers/index';
import { AnyVisualizerInfo } from '@/visualizers/VisualizerInfo';
import Backend from '@/api/backend';
declare type VMCallback = (params: CallbackPayload) => void;
interface CallbackPayload {
    manager: VisualizerManager;
    info?: AnyVisualizerInfo;
    error?: Error | unknown;
}
declare type CallbackEvent = 'success' | 'create' | 'delete' | 'error';
/**
 * The VisualizerManager creates and maintains `Visualizers` for the `MapVis.vue` component
 * @param: config:
 *   * backend: A `Client` for accessing the Simulation Engine backend
 *   * onSuccess: A callback (or array of callbacks) that is/are invoked whenever the Visualizers
 *     have been successfully updated to the state required by the given `layerInfos` in
 *     `VisualizerManager.updateVisualizers()`
 *   * onFailure: A callback (or array of callbacks) that is invoked when an uncaught error is
 *     thrown during updating the visualizers. Note: many errors are caught by the process of
 *     updating the visualizers, and these errors are instead stored in the `AnyVisualizerInfo.errors`
 *     dictionary. In these cases, the `onFailure` callbacks are not invoked
 */
export default class VisualizerManager {
    protected backend: Backend;
    protected visualizers: Record<string, Visualizer>;
    private desiredInfos;
    private currentInfos;
    protected callbacks: Record<CallbackEvent, VMCallback[]>;
    private loading;
    constructor(config: {
        backend: Backend;
        onSuccess?: VMCallback | VMCallback[];
        onError?: VMCallback | VMCallback[];
        onCreate?: VMCallback | VMCallback[];
        onDelete?: VMCallback | VMCallback[];
    });
    getVisualizers(): Visualizer[];
    on(event: CallbackEvent, callbacks: VMCallback | VMCallback[]): void;
    updateVisualizers(layerInfos: AnyVisualizerInfo[]): Promise<void>;
    private doUpdateVisualizers;
    private removeVisualizers;
    private createVisualizers;
    private createVisualizer;
    private reloadVisualizers;
    private finalize;
    private invokeCallbacks;
}
export {};
