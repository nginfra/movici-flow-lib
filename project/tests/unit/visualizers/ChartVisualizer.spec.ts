import {
  applyChartData,
  buildStreamingChartData,
  ChartDataPoint
} from '@movici-flow-common/visualizers/charts/builder';
import { StreamingTapefile } from '@movici-flow-common/visualizers/tapefile';

describe('buildStreamingChartData', () => {
  let tapefile: StreamingTapefile<number>,
    initialData: [number, number][] | null = null,
    updateData: [number, number][] | null = null;

  beforeEach(() => {
    tapefile = new StreamingTapefile('prop');
    tapefile.initialize({
      initialData: {
        id: [1, 2, 3],
        prop: [0, 0, 0]
      }
    });

    tapefile.addUpdate(
      {
        timestamp: 1,
        iteration: 1,
        data: {
          id: [1],
          prop: [1]
        }
      },
      0
    );
    tapefile.addUpdate(
      {
        timestamp: 2,
        iteration: 2,
        data: {
          id: [2],
          prop: [2]
        }
      },
      1
    );
    buildStreamingChartData({
      idx: 1,
      tapefile,
      onInitial(data) {
        initialData = data;
      },
      onUpdate(data) {
        updateData = data;
      }
    });
  });
  it('builds chart data from tapefile', () => {
    expect(initialData).toStrictEqual([
      [0, 0],
      [2, 2]
    ]);
  });
  it('updates chart data on current timestamp', () => {
    tapefile.addUpdate(
      {
        timestamp: 2,
        iteration: 3,
        data: {
          id: [2],
          prop: [3]
        }
      },
      2
    );
    expect(updateData).toStrictEqual([[2, 3]]);
  });
  it('updates chart data on new timestamp', () => {
    tapefile.addUpdate(
      {
        timestamp: 3,
        iteration: 3,
        data: {
          id: [2],
          prop: [3]
        }
      },
      2
    );
    expect(updateData).toStrictEqual([
      [2, 2],
      [3, 3]
    ]);
  });
  it('emits multiple values at once', () => {
    tapefile.addUpdate(
      {
        timestamp: 3,
        iteration: 3,
        data: {
          id: [2],
          prop: [30]
        }
      },
      3
    );
    tapefile.addUpdate(
      {
        timestamp: 2,
        iteration: 2,
        data: {
          id: [2],
          prop: [20]
        }
      },
      2
    );
    expect(updateData).toStrictEqual([
      [2, 20],
      [3, 30]
    ]);
  });
  it('emits emtpy on no data', () => {
    tapefile = new StreamingTapefile('prop');
    tapefile.initialize({
      initialData: {
        id: [1, 2, 3]
      }
    });

    buildStreamingChartData({
      idx: 1,
      tapefile,
      onInitial(data) {
        initialData = data;
      },
      onUpdate(data) {
        updateData = data;
      }
    });

    expect(initialData).toStrictEqual([]);
    tapefile.addUpdate(
      {
        timestamp: 1,
        iteration: 2,
        data: {
          id: [1]
        }
      },
      2
    );
  });
});

describe('applyChartData', () => {
  let data: ChartDataPoint[] = [];

  beforeEach(() => {
    data = [];
    applyChartData(data, [[0, 1]]);
  });
  it('adds data to empty chart', () => {
    expect(data).toStrictEqual([{ x: 0, y: 1 }]);
  });

  it('adds data to existing chart', () => {
    applyChartData(data, [
      [1, 2],
      [3, 4]
    ]);
    expect(data).toStrictEqual([
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 4 }
    ]);
  });
  it('overwrites when last timestamp matches first data point', () => {
    applyChartData(data, [
      [0, 2],
      [1, 3]
    ]);
    expect(data).toStrictEqual([
      { x: 0, y: 2 },
      { x: 1, y: 3 }
    ]);
  });
});
