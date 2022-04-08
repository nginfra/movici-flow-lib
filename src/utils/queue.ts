export interface IQueue<T> {
  pop(): T | undefined;
  push(item: T): void;
  length: number;
}
export class Queue<T> implements IQueue<T> {
  private inner: T[];
  constructor() {
    this.inner = [];
  }
  get length(): number {
    return this.inner.length;
  }
  pop() {
    return this.inner.shift();
  }
  push(item: T) {
    this.inner.push(item);
  }
}
type Comparator<T> = (a: T, b: T) => number;

export class PriorityQueue<T> implements IQueue<T> {
  private inner: T[];
  private comparator?: Comparator<T>;
  constructor(comparator?: (a: T, b: T) => number) {
    this.inner = [];
    this.comparator = comparator;
  }
  get length(): number {
    return this.inner.length;
  }
  pop() {
    return heapPop(this.inner, this.comparator);
  }
  push(item: T) {
    return heapPush(this.inner, item, this.comparator);
  }
}


export function heapPush<T>(heap: T[], item: T, comparator?: Comparator<T>) {
  comparator = comparator ?? ((a: T, b: T) => (a < b ? -1 : a === b ? 0 : 1));
  heap.push(item);
  bubbleUp(heap, comparator);
}
export function heapPop<T>(heap: T[], comparator?: Comparator<T>): T | undefined {
  comparator = comparator ?? ((a: T, b: T) => (a < b ? -1 : a === b ? 0 : 1));
  if (heap.length < 2) {
    return heap.pop();
  }
  swap(heap, 0, heap.length - 1);
  const rv = heap.pop();
  bubbleDown(heap, comparator);
  return rv;
}
function swap<T>(heap: T[], a: number, b: number) {
  const tmp = heap[a];
  heap[a] = heap[b];
  heap[b] = tmp;
}

function bubbleUp<T>(heap: T[], comparator: Comparator<T>) {
  let idx = heap.length - 1;
  while (idx > 0) {
    const parentIdx = Math.floor((idx - 1) / 2);
    if (comparator(heap[parentIdx], heap[idx]) <= 0) {
      break;
    }
    swap(heap, idx, parentIdx);
    idx = parentIdx;
  }
}
function bubbleDown<T>(heap: T[], comparator: Comparator<T>) {
  if (heap.length < 2) return;
  let parentIdx = 0;
  /*eslint-disable-next-line no-constant-condition*/
  while (true) {
    let toSwap: number | null = null;
    const [leftChild, rightChild] = [2 * parentIdx + 1, 2 * parentIdx + 2];
    // we mark the left child to swap if it's smaller than it's parent
    if (leftChild < heap.length && comparator(heap[leftChild], heap[parentIdx]) < 0) {
      toSwap = leftChild;
    }

    if (
      rightChild < heap.length &&
      // we mark right child to swap if we haven't marked the left child and the right
      // child is smaller than the parent
      ((toSwap === null && comparator(heap[rightChild], heap[parentIdx]) < 0) ||
        // or if we have marked the left child to swap and the right child is even smaller
        // than the left child
        (toSwap !== null && comparator(heap[rightChild], heap[leftChild]) < 0))
    ) {
      toSwap = rightChild;
    }
    if (toSwap === null) {
      break;
    }
    swap(heap, parentIdx, toSwap);
    parentIdx = toSwap;
  }
}
