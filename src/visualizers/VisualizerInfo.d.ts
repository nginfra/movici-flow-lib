import { EntityGeometry, FlowVisualizerConfig, FlowVisualizerOptions, UUID, VisualizationMode, VisualizerConfigurationSettings, VisualizerViewConfig } from '@/types';
declare abstract class BaseVisualizerInfo {
    name: string;
    datasetName: string;
    datasetUUID: string | null;
    scenarioUUID: string | null;
    entityGroup: string;
    mode: VisualizationMode;
    visible: boolean;
    errors: Record<string, string>;
    onProgress?: (p: number) => void;
    protected constructor(config?: Partial<BaseVisualizerInfo>);
    /**
     * `setError` and `unsetError` must be used to set/unset an error for a specific category (`key`).
     * This is necessary to maintain Vue reactivity on the `errors` object. Errors are given a
     * category so that specific parts of the code can manage their specific error by category
     * (eg. `load` for downloading errors, or `content` for when a `VisualizerInfo` object has invalid
     * content
     * @param key: the error category
     * @param value: the error message
     */
    setError(key: string, value: string): void;
    /**
     * Unset an error by category (`key`). See also `setError` above
     * @param key: the error category
     */
    unsetError(key: string): void;
}
export declare class VisualizerInfo extends BaseVisualizerInfo {
    /**
     * This class contains information about a visualizer. It contains information about what to
     * visualize, such as the datasetName and entityGroup, information specific to the Visualizer
     * (settings) and more contextual information (errors, and an onProgress callback)
     * */
    geometry: EntityGeometry | null;
    settings: VisualizerConfigurationSettings;
    constructor(config?: Partial<VisualizerInfo>);
    get id(): string;
    /**
     * Create a `VisualizerInfo` object from a `VisualizerViewConfig`. This also requires giving the
     * scenario UUID. The `VisualizerInfo` must still be validated for any content errors.
     * @param config: VisualizerViewConfig
     * @param scenarioUUID: A Scenario UUID
     */
    static fromLayerConfig(config: VisualizerViewConfig, scenarioUUID: UUID): VisualizerInfo;
}
export declare class ComposableVisualizerInfo extends BaseVisualizerInfo {
    settings?: FlowVisualizerOptions;
    id: string;
    constructor(config?: Partial<ComposableVisualizerInfo>);
    toVisualizerConfig(): FlowVisualizerConfig;
}
export declare type AnyVisualizerInfo = VisualizerInfo | ComposableVisualizerInfo;
export {};
