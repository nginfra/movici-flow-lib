import {
  FlowVisualizerType,
  type ByValueColorClause,
  type StaticColorClause,
  type LayerConstructor,
} from "@movici-flow-lib/types";
import { ComposableVisualizerInfo } from "@movici-flow-lib/visualizers/VisualizerInfo";
import { createTapefileFromStateAndUpdates } from "@movici-flow-lib/visualizers/tapefile";
import { ColorModule } from "@movici-flow-lib/visualizers/visualizerModules/";
import { describe, expect, it, vi } from "vitest";

const ScatterplotLayer = {
  layerName: "ScatterplotLayer",
} as LayerConstructor<unknown, unknown>;

function getInfoWithColorClause(
  clause: { byValue: ByValueColorClause } | { static: StaticColorClause }
) {
  return new ComposableVisualizerInfo({
    settings: {
      type: FlowVisualizerType.POINTS,
      color: clause,
    },
  });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pointVisualizer(): any {
  return {
    requestTapefile: vi.fn(),
  };
}

function getTapefile() {
  return createTapefileFromStateAndUpdates(
    { name: "some_prop" },
    {
      id: [0, 1],
      some_prop: [0, 1],
    },
    []
  );
}
describe("ColorModule", () => {
  it("generates layer props with static color", () => {
    const info = getInfoWithColorClause({
      static: {
        color: [1, 2, 3],
      },
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
                color: [1, 2, 3],
              },
            },
          ],
        },
      },
    });
  });
  it("generates layer props with byValue color", () => {
    const info = getInfoWithColorClause({
      byValue: {
        type: "buckets",
        colors: [
          [0, [0, 0, 0]],
          [1, [1, 1, 1]],
        ],
        attribute: { name: "some_prop", data_type: "INT", min_val: 0, max_val: 1 },
      },
    });
    const visualizer = pointVisualizer();
    expect(
      new ColorModule({ info }).compose({ type: ScatterplotLayer, props: {} }, visualizer).props
        .getFillColor
    ).toBeInstanceOf(Function);
  });
  it("requests tapefile for attribute", () => {
    const info = getInfoWithColorClause({
      byValue: {
        type: "buckets",
        colors: [
          [0, [0, 0, 0]],
          [1, [1, 1, 1]],
        ],
        attribute: { name: "some_prop", data_type: "INT", min_val: 0, max_val: 1 },
      },
    });
    const visualizer = pointVisualizer();
    new ColorModule({ info }).compose({ type: ScatterplotLayer, props: {} }, visualizer);

    const call = visualizer.requestTapefile.mock.calls[0];
    expect(call[0]).toStrictEqual({
      name: "some_prop",
      data_type: "INT",
      min_val: 0,
      max_val: 1,
    });
    expect(call[1]).toBeInstanceOf(Function);
  });
  it("prepares Colors for gradients", () => {
    const clause: ByValueColorClause = {
      type: "gradient",
      colors: [
        [0, [0, 0, 0]],
        [1, [1, 1, 1]],
      ],
      attribute: { name: "some_prop", data_type: "INT", min_val: 0, max_val: 1 },
    };
    const info = getInfoWithColorClause({
      byValue: clause,
    });
    const modifier = new ColorModule({ info });
    const colors = modifier.prepareColors(clause);
    expect(colors.length).toBe(20);
    expect(colors[1][0]).toBeCloseTo(1 / 19);
  });
  it("can request a color through the accessor", () => {
    const info = getInfoWithColorClause({
      byValue: {
        type: "buckets",
        colors: [
          [0, [10, 10, 10]],
          [1, [11, 11, 11]],
        ],
        attribute: {
          name: "some_prop",
          data_type: "INT",
          min_val: 0,
          max_val: 100,
        },
      },
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
