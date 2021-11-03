import { LineTopologyGetter, PointTopologyGetter } from '@movici-flow-common/visualizers/geometry';
import { DatasetDownloader } from '@movici-flow-common/utils/DatasetDownloader';

function newFakeStore(datasetData: unknown): DatasetDownloader {
  return ({
    getInitialData: jest.fn(() => datasetData),
    getDatasetState: jest.fn(() => datasetData)
  } as unknown) as DatasetDownloader;
}
describe('PointTopologyGetter', () => {
  it('asks for point_properties', async () => {
    const store: DatasetDownloader = newFakeStore({
      id: [1],
      point_properties: {
        position_x: [0],
        position_y: [0]
      }
    });
    const topoGetter = new PointTopologyGetter(store, 'some_entities');
    await topoGetter.getTopology();
    expect(store.getDatasetState).toBeCalledWith({
      entityGroup: 'some_entities',
      properties: [
        { component: 'point_properties', name: 'position_x' },
        { component: 'point_properties', name: 'position_y' }
      ]
    });
  });
});

describe('LineTopologyGetter', () => {
  it('asks for linestrings', async () => {
    const store: DatasetDownloader = newFakeStore({
      id: [1],
      shape_properties: {
        linestring_2d: [
          [
            [0, 0],
            [1, 1]
          ]
        ]
      }
    });
    const topoGetter = new LineTopologyGetter(store, 'some_entities');
    await topoGetter.getTopology();
    expect(store.getDatasetState).toBeCalledWith({
      entityGroup: 'some_entities',
      properties: [
        { component: 'shape_properties', name: 'linestring_2d' },
        {
          component: 'shape_properties',
          name: 'linestring_3d'
        }
      ]
    });
  });
});
