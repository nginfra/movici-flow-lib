import { VisualizerContext } from '@movici-flow-common/visualizers/visualizers';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import {
  StaticLineVisualizer,
  StaticPointVisualizer
} from '@movici-flow-common/visualizers/staticVisualizers';
import { VisualizerConfigurationSettings, LayerKind } from '@movici-flow-common/types';
import { EntityGeometry } from '@movici-flow-common/types/geometry';
import { DatasetDownloader } from '@movici-flow-common/api/DatasetDownloader';
import { VisualizerInfo } from '@movici-flow-common/visualizers';

function fakeStore(result: unknown): DatasetDownloader {
  return ({
    getInitialData: jest.fn(() => {
      return result;
    }),
    getDatasetState: jest.fn(() => {
      return result;
    })
  } as unknown) as DatasetDownloader;
}

function getPointVisualizer(
  kind: LayerKind = LayerKind.STATIC_COLOR,
  config: Partial<VisualizerContext> | null = null
) {
  config = config || {};
  return new StaticPointVisualizer({
    datasetStore: fakeStore({}),
    info: new VisualizerInfo({
      settings: getLayerKindSettings(kind)
    }),
    ...config
  });
}

function getLineVisualizer(
  kind: LayerKind = LayerKind.STATIC_COLOR,
  config: Partial<VisualizerContext> | null = null
) {
  config = config || {};
  return new StaticLineVisualizer({
    datasetStore: (fakeStore({}) as unknown) as DatasetDownloader,
    info: new VisualizerInfo({
      settings: getLayerKindSettings(kind)
    }),
    ...config
  });
}

function getLayerKindSettings(kind: LayerKind): VisualizerConfigurationSettings {
  switch (kind) {
    case LayerKind.HEAT_MAP:
    case LayerKind.UNKNOWN:
      return { kind };
    case LayerKind.COLOR_MAP:
      return {
        kind,
        property: { component: null, name: 'id', data_type: 'INT', description: '', unit: '' },
        colors: [],
        undefinedColor: [1, 2, 3],
        specialColor: [4, 5, 6],
        baseColorOverride: null
      };
    case LayerKind.STATIC_COLOR:
      return { kind, color: [1, 2, 3] };
    case LayerKind.ACTIVE_ENTITY:
      return {
        kind,
        property: { component: null, name: 'id', data_type: 'INT', description: '', unit: '' },
        inverted: false,
        onHover: { component: null, name: 'display_name' },
        color: [1, 2, 3]
      };
  }
}

describe('StaticDatasetVisualizer', () => {
  // use StaticPointVisualizer as a stand-in for the base class
  let visualizer!: StaticPointVisualizer;
  function fakeStore(getProps: () => unknown) {
    return {
      getInitialData: getProps,
      getDatasetState: getProps
    };
  }
  const config = {
    geometry: EntityGeometry.POINT,
    datasetStore: (fakeStore(
      jest.fn(() => {
        return { id: [] };
      })
    ) as unknown) as DatasetDownloader,
    info: new VisualizerInfo({
      entityGroup: 'some_entities'
    })
  };
  it('calls the onLoad callback', async () => {
    const onLoad = jest.fn();
    visualizer = new StaticPointVisualizer({ ...config, onLoad });
    await visualizer.load();
    expect(onLoad).toBeCalled();
  });
  it('calls the onError callback', async () => {
    const onError = jest.fn();
    visualizer = new StaticPointVisualizer({
      ...config,
      onError: onError,
      datasetStore: (fakeStore(() => {
        throw new Error('Some error');
      }) as unknown) as DatasetDownloader
    });
    await visualizer.load();
    expect(onError).toBeCalledWith(new Error('Some error'));
  });
  it('has the right priority', () => {
    const v1 = getPointVisualizer(LayerKind.STATIC_COLOR);
    const v2 = getPointVisualizer(LayerKind.HEAT_MAP);
    expect(v1.priority < v2.priority).toBeTruthy();
  });
});

describe('StaticPointVisualizer', () => {
  let visualizer!: StaticPointVisualizer;
  beforeEach(() => {
    visualizer = getPointVisualizer(LayerKind.STATIC_COLOR, {
      datasetStore: fakeStore({
        id: [1],
        point_properties: {
          position_x: [0],
          position_y: [0]
        }
      })
    });
  });

  it('returns a ScatterplotLayer for deck.gl', async () => {
    const layer = visualizer.getLayer();
    expect(layer).toBeInstanceOf(ScatterplotLayer);
  });
  it('can return a heat map', async () => {
    const visualizer = getPointVisualizer(LayerKind.HEAT_MAP);
    const layer = visualizer.getLayer();
    expect(layer).toBeInstanceOf(HeatmapLayer);
  });
  it('has the right color', async () => {
    await visualizer.load();
    const layer = visualizer.getLayer();
    if (!(layer instanceof ScatterplotLayer)) {
      throw Error('Must be Scatterplotlayer');
    }
    expect(layer.props.getFillColor).toStrictEqual([1, 2, 3]);
  });
});

describe('StaticLineVisualizer', () => {
  let visualizer!: StaticLineVisualizer;
  beforeEach(() => {
    visualizer = getLineVisualizer(LayerKind.STATIC_COLOR, {
      datasetStore: fakeStore({
        id: [1],
        shape_properties: {
          linestring_2d: [
            [
              [0, 0],
              [1, 1]
            ]
          ]
        }
      })
    });
  });

  it('returns a StaticLineVisualizer with data for deck.gl', async () => {
    await visualizer.load();
    const layer = visualizer.getLayer();
    await layer.props;
    expect(layer).toBeInstanceOf(PathLayer);
  });
  it('has the right color', async () => {
    await visualizer.load();
    const layer = visualizer.getLayer();
    expect(layer.props.getColor).toStrictEqual([1, 2, 3]);
  });
});
