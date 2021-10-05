import { VisualizerConfigurationSettings } from '@/types';
/**
 * Cleanup VisualizerConfigurationSettings. During configuration of a visualizer, it settings
 * may be polluted with attributes of different kinds of visualizers. This function returns a new
 * object containing only the fields belonging to the `VisualizerConfigurationSettings`
 * @param rawSettings: `VisualizerConfigurationSettings` that may contain extra fields/attributes
 */
export declare function cleanVisualizerSettings(rawSettings: VisualizerConfigurationSettings): VisualizerConfigurationSettings;
