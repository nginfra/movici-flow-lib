import { IQueue, Queue } from '@movici-flow-common/utils/queue';

export interface Task {
  getTask(): Promise<void>;
}
export interface PrioritizedTask extends Task {
  priority: number;
}

export class TaskDispatcher<T extends Task = Task> {
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
      task.getTask().finally(() => {
        this.running--;
        this.next();
      });

      this.running++;
    } else {
      this.onReady?.();
    }
  }
}
