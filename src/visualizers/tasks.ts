import { IQueue, Queue } from '@movici-flow-common/utils/queue';

export interface Task<T> {
  getTask(): Promise<T>;
  onDone?(result: T): void;
  onError?(err: unknown): void;
}
export interface PrioritizedTask<T> extends Task<T> {
  priority: number;
}

export interface ITaskDispatcher<T extends Task<unknown>> {
  push(task: T): void;
}
export class TaskDispatcher<T extends Task<unknown> = Task<unknown>> implements ITaskDispatcher<T> {
  private MAX_CONCURRENT: number;
  private queue: IQueue<T>;
  private running: number;
  private onReady?: () => void;
  constructor({
    MAX_CONCURRENT = 10,
    queue,
    onReady
  }: {
    MAX_CONCURRENT?: number;
    queue?: IQueue<T>;
    onReady?(): void;
  }) {
    this.MAX_CONCURRENT = MAX_CONCURRENT;
    this.queue = queue ?? new Queue();
    this.running = 0;
    this.onReady = onReady;
  }

  push(task: T) {
    this.queue.push(task);
    this.next();
  }
  private next() {
    if (this.running >= this.MAX_CONCURRENT) {
      return;
    }
    const task = this.queue.pop();

    if (task) {
      task
        .getTask()
        .then(obj => {
          this.running--;
          this.next();
          task.onDone?.(obj);
        })
        .catch(err => {
          this.running--;
          this.next();
          task.onError?.(err);
        });

      this.running++;
    } else {
      this.onReady?.();
    }
  }
}

export class BatchedTaskDispatcher<T extends Task<unknown> = Task<unknown>>
  implements ITaskDispatcher<T>
{
  private BATCH_SIZE: number;
  private queue: IQueue<T>;
  private running: boolean;
  private onReady?: () => void;
  constructor({
    BATCH_SIZE = 10,
    queue,
    onReady
  }: {
    BATCH_SIZE?: number;
    queue?: IQueue<T>;
    onReady?(): void;
  }) {
    this.BATCH_SIZE = BATCH_SIZE;
    this.queue = queue ?? new Queue();
    this.running = false;
    this.onReady = onReady;
  }
  push(task: T) {
    this.queue.push(task);
    this.next();
  }
  next() {
    if (this.running) return;

    const tasks: T[] = [];
    while (tasks.length < this.BATCH_SIZE) {
      const task = this.queue.pop();
      if (!task) break;
      tasks.push(task);
    }
    if (tasks.length) {
      console.log(`new batch of size ${tasks.length}`);
      this.running = true;
      Promise.all(tasks.map(t => t.getTask()))
        .then(results => {
          for (let i = 0; i < tasks.length; i++) {
            tasks[i].onDone?.(results[i]);
          }
        })
        .catch(err => {
          for (let i = 0; i < tasks.length; i++) {
            tasks[i].onError?.(err);
          }
        })
        .finally(() => {
          this.running = false;
          this.next();
        });
    } else {
      this.onReady?.();
    }
  }
}
