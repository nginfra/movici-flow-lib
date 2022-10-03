import { LineTopologyGetter, PointTopologyGetter } from '@movici-flow-common/visualizers/geometry';
import { DatasetDownloader } from '@movici-flow-common/utils/DatasetDownloader';
import { ImportantAttribute } from '@movici-flow-common/types';

function newFakeStore(datasetData: unknown): DatasetDownloader {
  return {
    getInitialData: jest.fn(() => datasetData),
    getDatasetState: jest.fn(() => datasetData),
    getMetaData: jest.fn(() => new Object())
  } as unknown as DatasetDownloader;
}

const IMPORTANT_ATTRIBUTES = Object.values(ImportantAttribute).map((a: string) => {
  return {
    component: '',
    name: a
  };
});

describe('PointTopologyGetter', () => {
  it('asks for point geometry', async () => {
    const store: DatasetDownloader = newFakeStore({
      id: [1],
      'geometry.x': [0],
      'geometry.y': [0]
    });
    const topoGetter = new PointTopologyGetter(store, 'some_entities');
    await topoGetter.getTopology();
    expect(store.getDatasetState).toBeCalledWith({
      entityGroup: 'some_entities',
      properties: [
        { component: null, name: 'geometry.x' },
        { component: null, name: 'geometry.y' },
        ...IMPORTANT_ATTRIBUTES
      ]
    });
  });
});

describe('LineTopologyGetter', () => {
  it('asks for linestrings', async () => {
    const store: DatasetDownloader = newFakeStore({
      id: [1],
      'geometry.linestring_2d': [
        [
          [0, 0],
          [1, 1]
        ]
      ]
    });
    const topoGetter = new LineTopologyGetter(store, 'some_entities');
    await topoGetter.getTopology();
    expect(store.getDatasetState).toBeCalledWith({
      entityGroup: 'some_entities',
      properties: [
        { component: null, name: 'geometry.linestring_2d' },
        { component: null, name: 'geometry.linestring_3d' },
        ...IMPORTANT_ATTRIBUTES
      ]
    });
  });
});
