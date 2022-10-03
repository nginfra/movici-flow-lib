import {
  CameraOptions,
  ColorClause,
  ComponentProperty,
  DatasetSummary,
  EntityGroupSummary,
  FlowVisualizerType,
  PopupClause,
  SizeClause
} from '../types';
import { isGrid, isLines, isPoints, isPolygons } from './geometry';
import { propertyString } from '../utils';
import { ChartVisualizerInfo, ComposableVisualizerInfo } from './VisualizerInfo';

export function visualizerSettingsValidator(summary: EntityGroupSummary) {
  return ({ settings }: ComposableVisualizerInfo) => {
    if (!settings) throw new Error('Visualizer has no settings configured');

    const validator = {
      [FlowVisualizerType.POINTS]: isPoints,
      [FlowVisualizerType.LINES]: isLines,
      [FlowVisualizerType.ARCS]: isLines,
      [FlowVisualizerType.POLYGONS]: isPolygons,
      [FlowVisualizerType.ICONS]: isPoints,
      [FlowVisualizerType.GRID]: isGrid,
      [FlowVisualizerType.FLOODING_GRID]: isGrid
    }[settings.type];

    if (!validator) {
      throw new Error(`Invalid visualizion type '${settings.type}'`);
    }
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

export function chartVisualizerValidator(summary: EntityGroupSummary) {
  return (info: ChartVisualizerInfo) => {
    validateAttribute(summary, info.attribute);
  };
}

export function validateAttribute(
  summary: EntityGroupSummary,
  attribute?: ComponentProperty | string | null
) {
  if (!attribute) {
    throw new Error(`No attribute defined`);
  }

  const attrName = typeof attribute === 'string' ? attribute : attribute.name,
    attrComponent = typeof attribute === 'string' ? null : attribute.component;

  for (const attr of summary.properties) {
    if (attrName === attr.name && (!attrComponent || attrComponent === attr.component)) {
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

export function validateForContentErrors(
  info: ComposableVisualizerInfo,
  summary?: DatasetSummary | null
) {
  if (!info.datasetUUID) {
    // might add errors here
    // or should the datasetUUID be mandatory on ComposableVisualizerInfo
    throw new Error('No dataset UUID specified');
  }
  if (!summary) {
    return;
  }
  const entitySummary = getEntitySummary({ info, summary });

  visualizerSettingsValidator(entitySummary)(info);
}

export function getEntitySummary(props: {
  info: ComposableVisualizerInfo;
  summary: DatasetSummary;
}) {
  const { info, summary } = props,
    index = summary.entity_groups.map(e => e.name).indexOf(info.entityGroup);

  if (index === -1) {
    throw new Error(`Invalid entity group '${info.entityGroup}`);
  }

  return summary.entity_groups[index];
}
