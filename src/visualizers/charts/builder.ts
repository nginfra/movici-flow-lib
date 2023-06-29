import type { TimeOrientedSimulationInfo } from "@movici-flow-lib/types";
import type { StreamingTapefile, TapefileUpdate } from "../tapefile";

export function buildStreamingChartData({
  idx,
  tapefile,
  onInitial,
  onUpdate,
}: {
  idx: number;
  tapefile: StreamingTapefile<number>;
  onInitial: (data: [number, number][]) => void;
  onUpdate: (data: [number, number][]) => void;
}) {
  let currentUpdates = tapefile.inner?.updates ?? [];
  let { pos, data } = getDataFromUpdates(currentUpdates, idx, 0);
  onInitial(data);

  tapefile.onData(() => {
    currentUpdates = tapefile.inner?.updates ?? [];
    ({ pos, data } = getDataFromUpdates(currentUpdates, idx, pos));
    onUpdate(data);
  });
}

function getDataFromUpdates<T>(
  updates: TapefileUpdate<T>[],
  idx: number,
  pos: number
): {
  data: [number, T][];
  pos: number;
} {
  const data: [number, T][] = [];
  for (; pos < updates.length; pos++) {
    const upd = updates[pos];
    const val = getValueFromUpdate(upd, idx);
    if (val === null) continue;
    data.push([upd.timestamp, val]);
  }
  if (pos > 0) {
    pos--; // reset pos to last valid position
  }
  return {
    data,
    pos,
  };
}
function getValueFromUpdate<T>(upd: TapefileUpdate<T>, idx: number): T | null {
  const dataIdx = upd.indices.indexOf(idx);
  if (dataIdx < 0) return null;
  return upd.data[dataIdx];
}

export interface ChartDataPoint {
  x: number;
  y: number;
  isFinal?: boolean;
}
export function applyChartData(
  currentData: ChartDataPoint[],
  data: [number, number][],
  timeline?: TimeOrientedSimulationInfo | null
): ChartDataPoint[] {
  if (!data.length) return currentData;

  if (currentData.length && currentData[currentData.length - 1].isFinal) {
    currentData.pop();
  }

  const toAdd: ChartDataPoint[] = data.map(([ts, val]) => {
    return {
      x: ts,
      y: Number(val),
    };
  });

  if (currentData.length) {
    if (toAdd[0].x === currentData[currentData.length - 1].x) {
      currentData.pop();
    }
  }
  currentData.push(...toAdd);

  if (currentData.length) {
    if (timeline) {
      currentData.push({
        x: timeline.duration,
        y: currentData[currentData.length - 1].y,
        isFinal: true,
      });
    }
  }

  return currentData;
}
