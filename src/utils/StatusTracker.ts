/**
 * StatusTracker can be used to report progress / errors during the asynchronous resolution
 * of tasks, eg when downloading tapefiles to be used by visualizers.
 *
 * In the constructor, the owner of the status tracker (eg. the VizualizerElement) registers which
 * tasks it expects status from and the different weight for each task towards the total progress.
 *
 * Multiple streams of tasks can then each register themselves and indicate which tasks they
 * report progress on. Every stream is given equal weight for their respective tasks. The
 * StatusTracker then combines the progress for every stream for every task into a single progress
 * number
 *
 * Progress is reported as a number between 0 and 100
 *
 */
export default class StatusTracker {
  weights: Record<string, number>;
  onProgress: (val: number) => void;
  onError?: (task: string, error: unknown) => void;
  currentProgress: Record<string, Record<number, number>>; // keys are task and id
  streams: number;
  constructor({
    tasks,
    onProgress,
    onError,
  }: {
    tasks: Record<string, number>;
    onProgress: (val: number) => void;
    onError?: (task: string, error: unknown) => void;
  }) {
    this.weights = tasks;
    this.onProgress = onProgress;
    this.onError = onError;
    this.currentProgress = Object.keys(tasks).reduce(
      (obj, key) => {
        obj[key] = {} as Record<number, number>;
        return obj;
      },
      {} as Record<string, Record<number, number>>,
    );
    this.streams = -1;
  }

  addTasks(tasks: Record<string, number>, overwrite = false) {
    for (const [task, weight] of Object.entries(tasks)) {
      if (!overwrite && this.weights[task] != undefined) {
        throw new Error(`Task '${task} is already defined`);
      }
      this.currentProgress[task] ??= {};
      this.weights[task] = weight;
    }
  }

  register(tasks: string[]): number {
    const id = ++this.streams;
    for (const task of tasks) {
      if (this.currentProgress?.[task]) {
        this.currentProgress[task][id] = 0;
      }
    }
    return id;
  }

  updateProgress(id: number, task: string, val: number): void {
    if (Object.keys(this.weights).indexOf(task) === -1) {
      // We ignore tasks that are not tracked by the StatusTracker
      return;
    }
    if (this.currentProgress?.[task]?.[id] === undefined) {
      throw new Error(`id ${id} is not registered for task '${task}'`);
    }
    this.currentProgress[task][id] = val;
    this.onProgress(this.calculateProgress());
  }

  setError(id: number, task: string, error: unknown): void {
    if (!this.onError || Object.keys(this.weights).indexOf(task) === -1) {
      // We do not process tasks that are not tracked by the StatusTracker
      // and instead just throw them to the console
      console.error(`unhandled exception for task ${task}`, error);
    }
    if (this.currentProgress?.[task]?.[id] === undefined) {
      throw new Error(`id ${id} is not registered for task '${task}'`);
    }
  }

  calculateProgress(): number {
    const totalWeight = Object.values(this.weights).reduce((prev, curr) => prev + curr, 0);
    if (totalWeight === 0) return 100;
    let progress = 0;
    for (const [task, weight] of Object.entries(this.weights)) {
      const entries = Object.values(this.currentProgress[task] ?? {});
      if (!entries.length) continue;
      progress += (entries.reduce((prev, curr) => prev + curr, 0) / entries.length) * weight;
    }
    return progress / totalWeight;
  }
}
