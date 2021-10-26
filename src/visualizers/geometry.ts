import { transform, transformArray } from '@/flow/crs';
import {
  ComponentProperty,
  Coordinate,
  EntityGroupData,
  EntityGroupSummary,
  LineCoordinate,
  LineGeometryData,
  PointCoordinate,
  PointGeometryData,
  PolygonCoordinate,
  PolygonGeometryData,
  PropertyType,
  TopologyLayerData
} from '@/flow/types';
import { EntityGeometry } from '@/flow/types/geometry';
import { DatasetDownloader } from '@/flow/utils/DatasetDownloader';

/**
 * A `TopologyGetter` queries a DatasetStore for topology information of a certain entity group,
 * (ie. for point data, line data or polygon data) and converts that data into topology objects
 * `TopologyLayerData` which are used for the `data` prop of deck.gl `Layers`
 * @param store: a `DatasetStore` configured for the required dataset
 * @param entity: an entity group name
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class TopologyGetter<Data extends EntityGroupData<any>, Coord extends Coordinate> {
  protected store: DatasetDownloader;
  protected entity: string;
  abstract props: ComponentProperty[];
  constructor(store: DatasetDownloader, entity: string) {
    this.store = store;
    this.entity = entity;
  }
  abstract getTopology(): Promise<TopologyLayerData<Coord>[]>;
  protected abstract getCoordinate(data: Data, i: number): Coord | null;

  protected getTopologyFromEntityData(data: Data): TopologyLayerData<Coord>[] {
    const length = data.id.length;
    const rv: TopologyLayerData<Coord>[] = [];
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

export class PointTopologyGetter extends TopologyGetter<PointGeometryData, PointCoordinate> {
  props: ComponentProperty[] = [
    { component: 'point_properties', name: 'position_x' },
    { component: 'point_properties', name: 'position_y' }
  ];
  async getTopology() {
    const datasetData = await this.store.getDatasetState<PointGeometryData>({
      entityGroup: this.entity,
      properties: this.props
    });
    return this.getTopologyFromEntityData(datasetData);
  }
  getCoordinate(data: PointGeometryData, i: number) {
    if (!data?.point_properties?.position_x || !data?.point_properties?.position_y) {
      throw new Error('Point geometry not found in dataset');
    }
    if (
      data.point_properties.position_x[i] === null ||
      data.point_properties.position_y[i] === null
    ) {
      return null;
    }
    return transform([data.point_properties.position_x[i], data.point_properties.position_y[i]]);
  }
}

export class LineTopologyGetter extends TopologyGetter<LineGeometryData, LineCoordinate> {
  props: ComponentProperty[] = [
    { component: 'shape_properties', name: 'linestring_2d' },
    { component: 'shape_properties', name: 'linestring_3d' }
  ];
  async getTopology() {
    const datasetData = await this.store.getDatasetState<LineGeometryData>({
      entityGroup: this.entity,
      properties: this.props
    });
    return this.getTopologyFromEntityData(datasetData);
  }
  getCoordinate(data: LineGeometryData, i: number) {
    const arr = data?.shape_properties?.linestring_3d ?? data?.shape_properties?.linestring_2d;
    if (!arr) {
      throw new Error('Line geometry not found in dataset');
    }
    if (arr[i] === null) {
      return null;
    }
    return transformArray(arr[i]);
  }
}

export class PolygonTopologyGetter extends TopologyGetter<PolygonGeometryData, PolygonCoordinate> {
  props: ComponentProperty[] = [{ component: 'shape_properties', name: 'polygon' }];
  async getTopology() {
    const datasetData = await this.store.getDatasetState<PolygonGeometryData>({
      entityGroup: this.entity,
      properties: this.props
    });
    return this.getTopologyFromEntityData(datasetData);
  }
  getCoordinate(data: PolygonGeometryData, i: number) {
    const arr = data?.shape_properties?.polygon;
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
export class PointTopologyFromStateGetter extends TopologyGetter<
  PointGeometryData,
  PointCoordinate
> {
  props: ComponentProperty[] = [
    { component: 'point_properties', name: 'position_x' },
    { component: 'point_properties', name: 'position_y' }
  ];
  async getTopology() {
    const datasetData = await this.store.getDatasetState<PointGeometryData>({
      entityGroup: this.entity,
      properties: this.props
    });
    return this.getTopologyFromEntityData(datasetData);
  }
  getCoordinate(data: PointGeometryData, i: number): PointCoordinate | null {
    if (!data?.point_properties?.position_x || !data?.point_properties?.position_y) {
      throw new Error('Point geometry not found in dataset');
    }
    if (
      data.point_properties.position_x[i] === null ||
      data.point_properties.position_y[i] === null
    ) {
      return null;
    }

    return transform([data.point_properties.position_x[i], data.point_properties.position_y[i]]);
  }
}
export function determineEntityGeometry(summary: EntityGroupSummary): EntityGeometry | null {
  if (isPoints(summary.properties)) return EntityGeometry.POINT;
  if (isLines(summary.properties)) return EntityGeometry.LINE;
  if (isPolygons(summary.properties)) return EntityGeometry.POLYGON;
  return null;
}

export function isPoints(properties: PropertyType[]): boolean {
  return (
    properties.find(p => {
      return p.component === 'point_properties';
    }) !== undefined
  );
}

export function isLines(properties: PropertyType[]): boolean {
  return (
    properties.find(p => {
      return (
        p.component === 'shape_properties' &&
        (p.name === 'linestring_2d' || p.name === 'linestring_3d')
      );
    }) !== undefined
  );
}

export function isPolygons(properties: PropertyType[]): boolean {
  return (
    properties.find(p => {
      return p.component === 'shape_properties' && p.name === 'polygon';
    }) !== undefined
  );
}
