import { Index, StreamingTapefile } from "@movici-flow-lib/visualizers/tapefile";
import { beforeEach, describe, expect, it } from "vitest";

describe("StreamingTapefile", () => {
  let tf: StreamingTapefile<number>;
  const index = new Index([1, 2]);
  beforeEach(() => {
    tf = new StreamingTapefile("attr");
  });
  it("puts initial data as first update", () => {
    const initialData = { id: [1, 2], attr: [10, 20] };
    tf.initialize({ index, initialData });
    tf.moveTo(0);
    expect(tf.copyState()).toStrictEqual([10, 20]);
  });
  it("initializes with null when no initial data is present", () => {
    const initialData = { id: [1, 2] };
    tf.initialize({ index, initialData });
    tf.moveTo(0);
    expect(tf.copyState()).toStrictEqual([null, null]);
  });
  it("processes t0 update", () => {
    const initialData = { id: [1, 2] };
    tf.initialize({ index, initialData });
    tf.addUpdate(
      {
        timestamp: 0,
        iteration: 0,
        data: { id: [1, 2], attr: [11, 21] },
      },
      0
    );
    tf.moveTo(0);
    expect(tf.copyState()).toStrictEqual([11, 21]);
  });
  it("processes first update if not t0", () => {
    const initialData = { id: [1, 2] };
    tf.initialize({ index, initialData });
    tf.addUpdate(
      {
        timestamp: 1,
        iteration: 0,
        data: { id: [1, 2], attr: [11, 21] },
      },
      0
    );
    tf.moveTo(0);
    expect(tf.copyState()).toStrictEqual([null, null]);
    tf.moveTo(1);
    expect(tf.copyState()).toStrictEqual([11, 21]);
  });
  it("bumps update version on merge", () => {
    const initialData = { id: [1, 2], attr: [0, 0] };
    tf.initialize({ index, initialData });
    expect(tf.inner?.updates[0].version).toStrictEqual(1);
    tf.addUpdate(
      {
        timestamp: 0,
        iteration: 0,
        data: { id: [1], attr: [11] },
      },
      0
    );
    expect(tf.inner?.updates[0].version).toStrictEqual(2);
  });
});
