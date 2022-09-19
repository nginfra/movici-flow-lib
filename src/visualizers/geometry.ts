import { transform, transformArray } from '../crs';
import {
  ComponentProperty,
  Coordinate,
  EntityGroupData,
  LineCoordinate,
  LineGeometryData,
  PointCoordinate,
  PointGeometryData,
  PolygonCoordinate,
  PolygonGeometryData,
  TopologyLayerData,
  GridCellGeometryData
} from '../types';
import { DatasetDownloader } from '../utils/DatasetDownloader';

export interface ITopologyGetter<Coord extends Coordinate> {
  getTopology(): Promise<TopologyLayerData<Coord>[]>;
}
/**
 * A `TopologyGetter` queries a DatasetStore for topology information of a certain entity group,
 * (ie. for point data, line data or polygon data) and converts that data into topology objects
 * `TopologyLayerData` which are used for the `data` prop of deck.gl `Layers`
 * @param store: a `DatasetStore` configured for the required dataset
 * @param entity: an entity group name
 */
export abstract class SimpleTopologyGetter<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data extends EntityGroupData<any>,
  Coord extends Coordinate
> implements ITopologyGetter<Coord>
{
  protected store: DatasetDownloader;
  protected entity: string;
  abstract props: ComponentProperty[];
  constructor(store: DatasetDownloader, entity: string) {
    this.store = store;
    this.entity = entity;
  }
  async getTopology(): Promise<TopologyLayerData<Coord>[]> {
    const [datasetData, metaData] = await Promise.all([
      this.getDatasetData(),
      this.store.getMetaData()
    ]);
    const crs = metaData?.epsg_code;
    return this.getTopologyFromEntityData(datasetData, crs);
  }

  protected abstract getDatasetData(): Promise<Data>;
  protected abstract getCoordinate(
    data: Data,
    i: number,
    crs?: string | number | null
  ): Coord | null;

  protected getTopologyFromEntityData(
    data: Data,
    crs?: string | number | null
  ): TopologyLayerData<Coord>[] {
    const length = data.id.length;
    const rv: TopologyLayerData<Coord>[] = [];
    for (let i = 0; i < length; i++) {
      // todo test this
      const coord = this.getCoordinate(data, i, crs);
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

const POINT_ATTRIBUTES: ComponentProperty[] = [
  { component: null, name: 'geometry.x' },
  { component: null, name: 'geometry.y' }
];
const LINE_ATTRIBUTES: ComponentProperty[] = [
  { component: null, name: 'geometry.linestring_2d' },
  { component: null, name: 'geometry.linestring_3d' }
];
const POLYGON_ATTRIBUTES: ComponentProperty[] = [{ component: null, name: 'geometry.polygon' }];
const GRID_CELL_ATTRIBUTES: ComponentProperty[] = [{ component: null, name: 'grid.grid_points' }];

export class PointTopologyGetter extends SimpleTopologyGetter<PointGeometryData, PointCoordinate> {
  props: ComponentProperty[] = [
    { component: null, name: 'geometry.x' },
    { component: null, name: 'geometry.y' }
  ];
  protected getDatasetData(): Promise<PointGeometryData> {
    return this.store.getDatasetState<PointGeometryData>({
      entityGroup: this.entity,
      properties: POINT_ATTRIBUTES
    });
  }

  getCoordinate(data: PointGeometryData, i: number, crs?: string | number | null) {
    if (!data?.['geometry.x'] || !data?.['geometry.y']) {
      throw new Error('Point geometry not found in dataset');
    }
    if (data['geometry.x'][i] === null || data['geometry.y'][i] === null) {
      return null;
    }
    return transform([data['geometry.x'][i], data['geometry.y'][i]], crs);
  }
}

export class LineTopologyGetter extends SimpleTopologyGetter<LineGeometryData, LineCoordinate> {
  props: ComponentProperty[] = [
    { component: null, name: 'geometry.linestring_2d' },
    { component: null, name: 'geometry.linestring_3d' }
  ];
  protected getDatasetData(): Promise<LineGeometryData> {
    return this.store.getDatasetState<LineGeometryData>({
      entityGroup: this.entity,
      properties: LINE_ATTRIBUTES
    });
  }

  getCoordinate(data: LineGeometryData, i: number, crs?: string | number | null) {
    const arr = data?.['geometry.linestring_3d'] ?? data['geometry.linestring_2d'];
    if (!arr) {
      throw new Error('Line geometry not found in dataset');
    }
    if (arr[i] === null) {
      return null;
    }
    return transformArray(arr[i], crs);
  }
}

export class PolygonTopologyGetter extends SimpleTopologyGetter<
  PolygonGeometryData,
  PolygonCoordinate
> {
  props: ComponentProperty[] = [{ component: null, name: 'geometry.polygon' }];
  protected getDatasetData(): Promise<PolygonGeometryData> {
    return this.store.getDatasetState<PolygonGeometryData>({
      entityGroup: this.entity,
      properties: POLYGON_ATTRIBUTES
    });
  }

  getCoordinate(data: PolygonGeometryData, i: number, crs?: string | number | null) {
    const arr = data['geometry.polygon'];
    if (!arr) {
      throw new Error('Polygon geometry not found in dataset');
    }
    if (arr[i] === null) {
      return null;
    }
    return transformArray(arr[i], crs);
  }
}

type PointsByIdT = Record<number, PointCoordinate>;
export class GridTopologyGetter implements ITopologyGetter<PolygonCoordinate> {
  cellEntityGroup: string;
  pointEntityGroup: string;
  store: DatasetDownloader;

  constructor(store: DatasetDownloader, cellEntityGroup: string, pointEntityGroup: string) {
    this.store = store;
    this.cellEntityGroup = cellEntityGroup;
    this.pointEntityGroup = pointEntityGroup;
  }
  async getTopology(): Promise<TopologyLayerData<PolygonCoordinate>[]> {
    const [cellData, pointData, metaData] = await Promise.all([
      this.store.getDatasetState<GridCellGeometryData>({
        entityGroup: this.cellEntityGroup,
        properties: GRID_CELL_ATTRIBUTES
      }),
      this.store.getDatasetState<PointGeometryData>({
        entityGroup: this.pointEntityGroup,
        properties: POINT_ATTRIBUTES
      }),
      this.store.getMetaData()
    ]);
    const crs = metaData?.epsg_code;

    return this.getTopologyFromEntityData(cellData, this.getPointsByID(pointData, crs));
  }

  private getTopologyFromEntityData(
    data: GridCellGeometryData,
    points: PointsByIdT
  ): TopologyLayerData<PolygonCoordinate>[] {
    const length = data.id.length;
    const rv: TopologyLayerData<PolygonCoordinate>[] = [];
    for (let i = 0; i < length; i++) {
      const coord = this.getCellCoordinates(data, i, points);
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
  private getCellCoordinates(
    data: GridCellGeometryData,
    i: number,
    points: PointsByIdT
  ): PolygonCoordinate | null {
    const gridPoints = data['grid.grid_points'][i];
    const rv: PolygonCoordinate = [];
    for (let i = 0; i < gridPoints.length; i++) {
      const point = points[gridPoints[i]];

      if (!point) {
        return null;
      }
      rv.push(point);
    }
    return rv;
  }

  getPointsByID(data: PointGeometryData, crs?: string | number | null): PointsByIdT {
    const length = data.id.length;
    const points: PointsByIdT = {};
    for (let i = 0; i < length; i++) {
      const coord = this.getPointCoordinate(data, i, crs);
      if (!coord) {
        continue;
      }
      points[data.id[i]] = coord;
    }
    return points;
  }
  getPointCoordinate(data: PointGeometryData, i: number, crs?: string | number | null) {
    if (!data?.['geometry.x'] || !data?.['geometry.y']) {
      throw new Error('Point geometry not found in dataset');
    }
    if (data['geometry.x'][i] === null || data['geometry.y'][i] === null) {
      return null;
    }
    return transform([data['geometry.x'][i], data['geometry.y'][i]], crs);
  }
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
export const isGrid = containsAttributes(['grid.grid_points'], 1);
