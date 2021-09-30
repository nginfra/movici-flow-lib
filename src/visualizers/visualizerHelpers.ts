import {
  ActiveEntityLayerSettings,
  ColorMapLayerSettings,
  HeatmapLayerSettings,
  LayerKind,
  StaticColorLayerSettings,
  UnknownLayerSettings,
  VisualizerConfigurationSettings
} from '@/flow/src/types';

/**
 * Cleanup VisualizerConfigurationSettings. During configuration of a visualizer, it settings
 * may be polluted with attributes of different kinds of visualizers. This function returns a new
 * object containing only the fields belonging to the `VisualizerConfigurationSettings`
 * @param rawSettings: `VisualizerConfigurationSettings` that may contain extra fields/attributes
 */
export function cleanVisualizerSettings(
  rawSettings: VisualizerConfigurationSettings
): VisualizerConfigurationSettings {
  switch (rawSettings.kind) {
    case LayerKind.STATIC_COLOR:
      return new StaticColorLayerSettings(rawSettings);
    case LayerKind.HEAT_MAP:
      return new HeatmapLayerSettings();
    case LayerKind.COLOR_MAP:
      return new ColorMapLayerSettings(rawSettings);
    case LayerKind.ACTIVE_ENTITY:
      return new ActiveEntityLayerSettings(rawSettings);
    case LayerKind.UNKNOWN:
      return new UnknownLayerSettings();
  }
}
