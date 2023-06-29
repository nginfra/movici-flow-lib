import { heapPop, heapPush } from "@movici-flow-lib/utils/queue";
import { describe, it, expect } from "vitest";

function getRandomInt(minOrMax: number, max?: number): number {
  let min = minOrMax;
  if (max === undefined) {
    max = minOrMax;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomArray(max: number, count: number): number[] {
  const arr: number[] = Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = getRandomInt(max);
  }
  return arr;
}
const nTests = 100,
  minArraySize = 7,
  maxArraySize = 12,
  maxItem = 10;

function getTestParams(): [number[]][] {
  return Array.from(new Array(nTests), () => {
    const arraySize = getRandomInt(minArraySize, maxArraySize);
    return [getRandomArray(maxItem, arraySize)];
  });
}

function heapOrdered<T>(heap: T[], comparator: (a: T, b: T) => number, parentIdx = 0): boolean {
  const children = [2 * parentIdx + 1, 2 * parentIdx + 2];
  for (const child of children) {
    if (child >= heap.length) {
      return true;
    }
    if (comparator(heap[child], heap[parentIdx]) < 0) {
      return false;
    }
    if (!heapOrdered(heap, comparator, child)) {
      return false;
    }
  }
  return true;
}
describe("heapOrdered", () => {
  it.each([
    [[]],
    [[5, 4, 3]],
    [[5, 4, 5]],
    [[5, 4, 3, 4, 4, 3, 3]],
    [[5, 4, 3, 3, 4, 3]],
  ] as number[][][])("checks for ordered heap", (heap) => {
    heap;
    expect(heapOrdered<number>(heap, (a, b) => b - a)).toBeTruthy();
  });
  it.each([[[5, 6]], [[5, 5, 6]], [[5, 5, 4, 5, 6]], [[5, 4, 4, 4, 4, 4, 5]]] as number[][][])(
    "finds unordered heaps",
    (heap) => {
      heap;
      expect(heapOrdered<number>(heap, (a, b) => b - a)).toBeFalsy();
    }
  );
});

describe("heapPush", () => {
  it.each(getTestParams())("from array: %p it creates an ordered heap", (arr) => {
    const comparator = (a: number, b: number) => a - b;
    const heap = arr.reduce((heap, item) => {
      heapPush(heap, item, comparator);
      return heap;
    }, [] as number[]);
    expect(heapOrdered(heap, comparator)).toBeTruthy();
  });
});

describe("heapPop", () => {
  it.each(getTestParams())("from array: %p it pops items in the right order", (arr) => {
    // b-a signifies MaxHeap
    const comparator = (a: number, b: number) => b - a;

    const heap = arr.reduce((heap, item) => {
      heapPush(heap, item, comparator);
      return heap;
    }, [] as number[]);
    while (heap.length) {
      const maxVal = Math.max(...heap);
      expect(heapPop(heap, comparator)).toEqual(maxVal);
      expect(heapOrdered(heap, comparator)).toBeTruthy();
    }
  });
});
