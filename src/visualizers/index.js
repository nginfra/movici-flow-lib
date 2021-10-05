import { StaticLineVisualizer, StaticPointVisualizer, StaticPolygonVisualizer } from './staticVisualizers';
import { TapefileLineVisualizer, TapefilePointVisualizer, TapefilePolygonVisualizer } from '@/visualizers/tapefileVisualizers';
import { ActivePointVisualizer } from '@/visualizers/activeEntityVisualizers';
import { FlowVisualizerType, LayerKind } from '@/types';
import { EntityGeometry } from '@/types/geometry';
import { ComposableVisualizerInfo } from '@/visualizers/VisualizerInfo';
import { ComposableArcVisualizer, ComposableLineVisualizer, ComposablePointVisualizer, ComposablePolygonVisualizer } from '@/visualizers/composableVisualizers';
const SUPPORTED_VISUALIZERS = {
    [LayerKind.STATIC_COLOR]: {
        [EntityGeometry.POINT]: StaticPointVisualizer,
        [EntityGeometry.LINE]: StaticLineVisualizer,
        [EntityGeometry.POLYGON]: StaticPolygonVisualizer
    },
    [LayerKind.HEAT_MAP]: {
        [EntityGeometry.POINT]: StaticPointVisualizer,
        [EntityGeometry.LINE]: null,
        [EntityGeometry.POLYGON]: null
    },
    [LayerKind.ACTIVE_ENTITY]: {
        [EntityGeometry.POINT]: ActivePointVisualizer,
        [EntityGeometry.LINE]: null,
        [EntityGeometry.POLYGON]: null
    },
    [LayerKind.COLOR_MAP]: {
        [EntityGeometry.POINT]: TapefilePointVisualizer,
        [EntityGeometry.LINE]: TapefileLineVisualizer,
        [EntityGeometry.POLYGON]: TapefilePolygonVisualizer
    },
    [LayerKind.UNKNOWN]: {
        [EntityGeometry.POINT]: null,
        [EntityGeometry.LINE]: null,
        [EntityGeometry.POLYGON]: null
    }
};
export function getVisualizer(config) {
    const visClass = getVisualizerType(config.info);
    if (!visClass) {
        throw new Error(`Cannot visualize ${config.info.id}`);
    }
    return new visClass(config);
}
export function getVisualizerType(info) {
    return info instanceof ComposableVisualizerInfo
        ? getComposableVisualizerType(info)
        : getLegacyVisualizerType(info);
}
export function getLegacyVisualizerType(info) {
    return info.geometry ? SUPPORTED_VISUALIZERS[info.settings.kind][info.geometry] : null;
}
export function getComposableVisualizerType(info) {
    var _a;
    switch ((_a = info.settings) === null || _a === void 0 ? void 0 : _a.type) {
        case FlowVisualizerType.POINTS:
            return ComposablePointVisualizer;
        case FlowVisualizerType.LINES:
            return ComposableLineVisualizer;
        case FlowVisualizerType.POLYGONS:
            return ComposablePolygonVisualizer;
        case FlowVisualizerType.ARCS:
            return ComposableArcVisualizer;
        default:
            return null;
    }
}
export { VisualizerInfo } from '@/visualizers/VisualizerInfo';
