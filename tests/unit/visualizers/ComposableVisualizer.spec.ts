import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import {
  ByValueColorClause,
  FlowVisualizerType,
  StaticColorClause
} from '@movici-flow-common/types';
import { ScatterplotLayer } from '@deck.gl/layers';
import { createTapefileFromStateAndUpdates } from '@movici-flow-common/visualizers/tapefile';
import { ColorModule } from '@movici-flow-common/visualizers/visualizerModules/';

function getInfoWithColorClause(
  clause: { byValue: ByValueColorClause } | { static: StaticColorClause }
) {
  return new ComposableVisualizerInfo({
    settings: {
      type: FlowVisualizerType.POINTS,
      color: clause
    }
  });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pointVisualizer(): any {
  return {
    requestTapefile: jest.fn()
  };
}

function getTapefile() {
  return createTapefileFromStateAndUpdates(
    { component: null, name: 'some_prop' },
    {
      id: [0, 1],
      some_prop: [0, 1]
    },
    []
  );
}
describe('ColorModule', () => {
  it('generates layer props with static color', () => {
    const info = getInfoWithColorClause({
      static: {
        color: [1, 2, 3]
      }
    });
    const visualizer = pointVisualizer();
    expect(
      new ColorModule({ info }).compose({ type: ScatterplotLayer, props: {} }, visualizer)
    ).toStrictEqual({
      type: ScatterplotLayer,
      props: {
        getFillColor: [1, 2, 3],
        updateTriggers: {
          getFillColor: [
            {
              static: {
                color: [1, 2, 3]
              }
            }
          ]
        }
      }
    });
  });
  it('generates layer props with byValue color', () => {
    const info = getInfoWithColorClause({
      byValue: {
        type: 'buckets',
        colors: [
          [0, [0, 0, 0]],
          [1, [1, 1, 1]]
        ],
        attribute: { name: 'some_prop', component: null, data_type: 'INT' }
      }
    });
    const visualizer = pointVisualizer();
    expect(
      new ColorModule({ info }).compose({ type: ScatterplotLayer, props: {} }, visualizer).props
        .getFillColor
    ).toBeInstanceOf(Function);
  });
  it('requests tapefile for attribute', () => {
    const info = getInfoWithColorClause({
      byValue: {
        type: 'buckets',
        colors: [
          [0, [0, 0, 0]],
          [1, [1, 1, 1]]
        ],
        attribute: { name: 'some_prop', component: null, data_type: 'INT' }
      }
    });
    const visualizer = pointVisualizer();
    new ColorModule({ info }).compose({ type: ScatterplotLayer, props: {} }, visualizer);

    const call = visualizer.requestTapefile.mock.calls[0];
    expect(call[0]).toStrictEqual({ name: 'some_prop', component: null, data_type: 'INT' });
    expect(call[1]).toBeInstanceOf(Function);
  });
  it('prepares Colors for gradients', () => {
    const clause: ByValueColorClause = {
      type: 'gradient',
      colors: [
        [0, [0, 0, 0]],
        [1, [1, 1, 1]]
      ],
      attribute: { name: 'some_prop', component: null, data_type: 'INT' }
    };
    const info = getInfoWithColorClause({
      byValue: clause
    });
    const modifier = new ColorModule({ info });
    const colors = modifier.prepareColors(clause);
    expect(colors.length).toBe(20);
    expect(colors[1][0]).toBeCloseTo(1 / 19);
  });
  it('can request a color through the accessor', () => {
    const info = getInfoWithColorClause({
      byValue: {
        type: 'buckets',
        colors: [
          [0, [10, 10, 10]],
          [1, [11, 11, 11]]
        ],
        attribute: { name: 'some_prop', component: null, data_type: 'INT' }
      }
    });
    const visualizer = pointVisualizer();
    const params = new ColorModule({ info }).compose(
      { type: ScatterplotLayer, props: {} },
      visualizer
    );
    visualizer.requestTapefile.mock.calls[0][1](getTapefile());

    expect(params.props.getFillColor({ idx: 0 })).toStrictEqual([10, 10, 10]);
    expect(params.props.getFillColor({ idx: 1 })).toStrictEqual([11, 11, 11]);
  });
});
