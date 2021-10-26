import {
  CameraOptions,
  ColorClause,
  ComponentProperty,
  DatasetSummary,
  EntityGeometry,
  EntityGroupSummary,
  FlowVisualizerType,
  LayerKind,
  PopupClause,
  SizeClause,
  VisualizerViewConfig
} from '@/flow/types';
import { isLines, isPoints, isPolygons } from '@/flow/visualizers/geometry';
import { getEntitySummary, hasOwnProperty, propertyString } from '@/flow//utils';
import {
  AnyVisualizerInfo,
  ComposableVisualizerInfo,
  VisualizerInfo
} from '@/flow/visualizers/VisualizerInfo';

export function datasetValidator() {
  return function (info: AnyVisualizerInfo) {
    if (!info.datasetUUID) {
      throw new Error(`Dataset ${info.datasetName} does not exist or user not authorized`);
    }
  };
}

export function entityGroupValidator(summary: DatasetSummary) {
  return function (info: AnyVisualizerInfo) {
    const entitySummary = getEntitySummary(info.entityGroup, summary);

    if (!entitySummary) {
      throw new Error(`Entity group ${info.entityGroup} not found in dataset`);
    }
    if (hasOwnProperty(info, 'geometry')) {
      return geometryValidator(entitySummary)(info);
    }
  };
}

export function geometryValidator(summary: EntityGroupSummary) {
  return function (info: VisualizerInfo) {
    if (!info.geometry) {
      throw new Error(`${summary.name} has no geometry`);
    } else {
      const validator = {
        [EntityGeometry.POINT]: isPoints,
        [EntityGeometry.LINE]: isLines,
        [EntityGeometry.POLYGON]: isPolygons
      }[info.geometry];
      if (!validator(summary.properties)) {
        throw new Error(`${summary.name} has no ${info.geometry} geometry`);
      }
    }
    return true;
  };
}

export function layerKindValidator(summary: EntityGroupSummary) {
  return function (info: VisualizerInfo) {
    switch (info.settings.kind) {
      case LayerKind.COLOR_MAP:
        validateAttribute(summary, info.settings?.property);
        break;
      case LayerKind.ACTIVE_ENTITY:
        validateAttribute(summary, info.settings.property);
        validateAttribute(summary, info.settings.onHover);
        return;
      default:
        return;
    }
  };
}

export function visualizerSettingsValidator(summary: EntityGroupSummary) {
  return (info: ComposableVisualizerInfo) => {
    const settings = info.settings;
    if (!settings) throw new Error('Visualizer has no settings configured');
    const validator = {
      [FlowVisualizerType.POINTS]: isPoints,
      [FlowVisualizerType.LINES]: isLines,
      [FlowVisualizerType.ARCS]: isLines,
      [FlowVisualizerType.POLYGONS]: isPolygons
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

export function layerInfosToLayerConfig(infos: VisualizerInfo[]): VisualizerViewConfig[] {
  return infos.map(info => {
    return {
      name: info.name,
      geometry: info.geometry || undefined,
      dataset_name: info.datasetName,
      entity_group: info.entityGroup,
      mode: info.mode,
      visible: info.visible,
      settings: info.settings
    };
  });
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
