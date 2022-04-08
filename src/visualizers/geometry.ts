import { transform, transformArray } from '../crs';
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
  TopologyLayerData,
  EntityGeometry
} from '../types';
import { DatasetDownloader } from '../utils/DatasetDownloader';

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
    { component: null, name: 'geometry.x' },
    { component: null, name: 'geometry.y' }
  ];
  async getTopology() {
    const datasetData = await this.store.getDatasetState<PointGeometryData>({
      entityGroup: this.entity,
      properties: this.props
    });
    return this.getTopologyFromEntityData(datasetData);
  }
  getCoordinate(data: PointGeometryData, i: number) {
    if (!data?.['geometry.x'] || !data?.['geometry.y']) {
      throw new Error('Point geometry not found in dataset');
    }
    if (data['geometry.x'][i] === null || data['geometry.y'][i] === null) {
      return null;
    }
    return transform([data['geometry.x'][i], data['geometry.y'][i]]);
  }
}

export class LineTopologyGetter extends TopologyGetter<LineGeometryData, LineCoordinate> {
  props: ComponentProperty[] = [
    { component: null, name: 'geometry.linestring_2d' },
    { component: null, name: 'geometry.linestring_3d' }
  ];
  async getTopology() {
    const datasetData = await this.store.getDatasetState<LineGeometryData>({
      entityGroup: this.entity,
      properties: this.props
    });
    return this.getTopologyFromEntityData(datasetData);
  }
  getCoordinate(data: LineGeometryData, i: number) {
    const arr = data?.['geometry.linestring_3d'] ?? data['geometry.linestring_2d'];
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
  props: ComponentProperty[] = [{ component: null, name: 'geometry.polygon' }];
  async getTopology() {
    const datasetData = await this.store.getDatasetState<PolygonGeometryData>({
      entityGroup: this.entity,
      properties: this.props
    });
    return this.getTopologyFromEntityData(datasetData);
  }
  getCoordinate(data: PolygonGeometryData, i: number) {
    const arr = data['geometry.polygon'];
    if (!arr) {
      throw new Error('Polygon geometry not found in dataset');
    }
    if (arr[i] === null) {
      return null;
    }
    return transformArray(arr[i]);
  }
}

export function determineEntityGeometry(summary: EntityGroupSummary): EntityGeometry | null {
  if (isPoints(summary.properties)) return EntityGeometry.POINT;
  if (isLines(summary.properties)) return EntityGeometry.LINE;
  if (isPolygons(summary.properties)) return EntityGeometry.POLYGON;
  return null;
}

function containsAttributes(
  attributeNames: string[],
  minFound: number
): (attributes: ComponentProperty[]) => boolean {
  return (attributes: ComponentProperty[]): boolean => {
    return (
      attributes.filter(p => {
        return attributeNames.includes(p.name);
      }).length >= minFound
    );
  };
}

export const isPoints = containsAttributes(['geometry.x', 'geometry.y'], 2);
export const isLines = containsAttributes(['geometry.linestring_2d', 'geometry.linestring_3d'], 1);
export const isPolygons = containsAttributes(['geometry.polygon'], 1);
