import { transform, transformArray } from '@/crs';
import { EntityGeometry } from '@/types/geometry';
/**
 * A `TopologyGetter` queries a DatasetStore for topology information of a certain entity group,
 * (ie. for point data, line data or polygon data) and converts that data into topology objects
 * `TopologyLayerData` which are used for the `data` prop of deck.gl `Layers`
 * @param store: a `DatasetStore` configured for the required dataset
 * @param entity: an entity group name
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TopologyGetter {
    constructor(store, entity) {
        this.store = store;
        this.entity = entity;
    }
    getTopologyFromEntityData(data) {
        const length = data.id.length;
        const rv = [];
        for (let i = 0; i < length; i++) {
            // todo test this
            const coord = this.getCoordinate(data, i);
            if (!coord) {
                continue;
            }
            rv.push({
                id: data.id[i],
                idx: i,
                coordinates: coord
            });
        }
        return rv;
    }
}
export class PointTopologyGetter extends TopologyGetter {
    constructor() {
        super(...arguments);
        this.props = [
            { component: 'point_properties', name: 'position_x' },
            { component: 'point_properties', name: 'position_y' }
        ];
    }
    async getTopology() {
        const datasetData = await this.store.getDatasetState({
            entityGroup: this.entity,
            properties: this.props
        });
        return this.getTopologyFromEntityData(datasetData);
    }
    getCoordinate(data, i) {
        var _a, _b;
        if (!((_a = data === null || data === void 0 ? void 0 : data.point_properties) === null || _a === void 0 ? void 0 : _a.position_x) || !((_b = data === null || data === void 0 ? void 0 : data.point_properties) === null || _b === void 0 ? void 0 : _b.position_y)) {
            throw new Error('Point geometry not found in dataset');
        }
        if (data.point_properties.position_x[i] === null ||
            data.point_properties.position_y[i] === null) {
            return null;
        }
        return transform([data.point_properties.position_x[i], data.point_properties.position_y[i]]);
    }
}
export class LineTopologyGetter extends TopologyGetter {
    constructor() {
        super(...arguments);
        this.props = [
            { component: 'shape_properties', name: 'linestring_2d' },
            { component: 'shape_properties', name: 'linestring_3d' }
        ];
    }
    async getTopology() {
        const datasetData = await this.store.getDatasetState({
            entityGroup: this.entity,
            properties: this.props
        });
        return this.getTopologyFromEntityData(datasetData);
    }
    getCoordinate(data, i) {
        var _a, _b, _c;
        const arr = (_b = (_a = data === null || data === void 0 ? void 0 : data.shape_properties) === null || _a === void 0 ? void 0 : _a.linestring_3d) !== null && _b !== void 0 ? _b : (_c = data === null || data === void 0 ? void 0 : data.shape_properties) === null || _c === void 0 ? void 0 : _c.linestring_2d;
        if (!arr) {
            throw new Error('Line geometry not found in dataset');
        }
        if (arr[i] === null) {
            return null;
        }
        return transformArray(arr[i]);
    }
}
export class PolygonTopologyGetter extends TopologyGetter {
    constructor() {
        super(...arguments);
        this.props = [{ component: 'shape_properties', name: 'polygon' }];
    }
    async getTopology() {
        const datasetData = await this.store.getDatasetState({
            entityGroup: this.entity,
            properties: this.props
        });
        return this.getTopologyFromEntityData(datasetData);
    }
    getCoordinate(data, i) {
        var _a;
        const arr = (_a = data === null || data === void 0 ? void 0 : data.shape_properties) === null || _a === void 0 ? void 0 : _a.polygon;
        if (!arr) {
            throw new Error('Polygon geometry not found in dataset');
        }
        if (arr[i] === null) {
            return null;
        }
        return transformArray(arr[i]);
    }
}
/**
 * The default TopologyGetters download their topology from the initial data. This topology getter
 * downloads it's topology from a scenario state. For this to work, the `DatasetStore` must be
 * configured with a scenario uuid. The requested state is the end state of the scenario.
 */
export class PointTopologyFromStateGetter extends TopologyGetter {
    constructor() {
        super(...arguments);
        this.props = [
            { component: 'point_properties', name: 'position_x' },
            { component: 'point_properties', name: 'position_y' }
        ];
    }
    async getTopology() {
        const datasetData = await this.store.getDatasetState({
            entityGroup: this.entity,
            properties: this.props
        });
        return this.getTopologyFromEntityData(datasetData);
    }
    getCoordinate(data, i) {
        var _a, _b;
        if (!((_a = data === null || data === void 0 ? void 0 : data.point_properties) === null || _a === void 0 ? void 0 : _a.position_x) || !((_b = data === null || data === void 0 ? void 0 : data.point_properties) === null || _b === void 0 ? void 0 : _b.position_y)) {
            throw new Error('Point geometry not found in dataset');
        }
        if (data.point_properties.position_x[i] === null ||
            data.point_properties.position_y[i] === null) {
            return null;
        }
        return transform([data.point_properties.position_x[i], data.point_properties.position_y[i]]);
    }
}
export function determineEntityGeometry(summary) {
    if (isPoints(summary.properties))
        return EntityGeometry.POINT;
    if (isLines(summary.properties))
        return EntityGeometry.LINE;
    if (isPolygons(summary.properties))
        return EntityGeometry.POLYGON;
    return null;
}
export function isPoints(properties) {
    return (properties.find(p => {
        return p.component === 'point_properties';
    }) !== undefined);
}
export function isLines(properties) {
    return (properties.find(p => {
        return (p.component === 'shape_properties' &&
            (p.name === 'linestring_2d' || p.name === 'linestring_3d'));
    }) !== undefined);
}
export function isPolygons(properties) {
    return (properties.find(p => {
        return p.component === 'shape_properties' && p.name === 'polygon';
    }) !== undefined);
}
