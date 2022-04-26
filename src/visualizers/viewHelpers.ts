import {
  CameraOptions,
  ColorClause,
  ComponentProperty,
  EntityGroupSummary,
  FlowVisualizerType,
  PopupClause,
  SizeClause
} from '../types';
import { isLines, isPoints, isPolygons } from './geometry';
import { propertyString } from '../utils';
import { ComposableVisualizerInfo } from './VisualizerInfo';

export function visualizerSettingsValidator(summary: EntityGroupSummary) {
  return ({ settings }: ComposableVisualizerInfo) => {
    if (!settings) throw new Error('Visualizer has no settings configured');

    const validator = {
      [FlowVisualizerType.POINTS]: isPoints,
      [FlowVisualizerType.LINES]: isLines,
      [FlowVisualizerType.ARCS]: isLines,
      [FlowVisualizerType.POLYGONS]: isPolygons,
      [FlowVisualizerType.ICONS]: isPoints
    }[settings.type];

    if (!validator(summary.properties)) {
      throw new Error(`Cannot visualize ${summary.name} as '${settings.type}'`);
    }
    if (settings.color) {
      validateClause(summary, settings.color);
    }
    if (settings.size) {
      validateClause(summary, settings.size);
    }
    if (settings.popup) {
      validatePopupClause(summary, settings.popup);
    }
  };
}

function validateClause<T extends ColorClause | SizeClause>(
  summary: EntityGroupSummary,
  clause: T
) {
  if (clause.byValue) {
    clause.byValue.attribute = validateAttribute(summary, clause.byValue.attribute);
  }
}

function validatePopupClause(summary: EntityGroupSummary, clause: PopupClause) {
  for (const item of clause.items) {
    item.attribute = validateAttribute(summary, item.attribute);
  }
}

export function validateAttribute(
  summary: EntityGroupSummary,
  attribute?: ComponentProperty | null
) {
  if (!attribute) {
    throw new Error(`No attribute defined`);
  }
  for (const attr of summary.properties) {
    if (
      attribute.name === attr.name &&
      (!attribute.component || attribute.component === attr.component)
    ) {
      return attr;
    }
  }
  throw new Error(`Unknown property ${propertyString(attribute)}`);
}

export function simplifiedCamera(camera: CameraOptions): CameraOptions {
  return {
    longitude: camera.longitude,
    latitude: camera.latitude,
    zoom: camera.zoom,
    pitch: camera.pitch,
    bearing: camera.bearing
  };
}
