export default class IdleWorker {
  private task: () => boolean;
  private idleSince: number;
  readonly minIdleMiliseconds: number;
  private running: boolean;
  constructor(task: () => boolean, minIdleMiliseconds: number) {
    this.task = task;
    this.minIdleMiliseconds = minIdleMiliseconds;
    this.idleSince = Date.now();
    this.schedule(this.minIdleMiliseconds);
    this.running = true;
  }
  get currentIdleTime() {
    return Date.now() - this.idleSince;
  }

  /**
   * Schedule a task to run at the first moment when we're idle. If the task indicates
   * (by return value) that there are more tasks pending, we wait until the next tick and try to
   * run the next task. If we're not idle when we try to run the task, we wait until we've reached
   * our predicted minimum idle time and try again
   *
   * waitFor: wait for at least this amount of ms before checking idleness
   */
  private schedule(waitFor: number) {
    setTimeout(
      () => {
        if (!this.running) return;
        if (this.currentIdleTime >= this.minIdleMiliseconds) {
          const doNext = this.task();
          if (doNext) {
            this.schedule(0);
          } else {
            this.schedule(this.minIdleMiliseconds);
          }
        } else {
          this.schedule(this.minIdleMiliseconds - this.currentIdleTime);
        }
      },
      waitFor < 0 ? 0 : waitFor
    );
  }

  notIdle() {
    this.idleSince = Date.now();
  }
  stop() {
    this.running = false;
  }
}
