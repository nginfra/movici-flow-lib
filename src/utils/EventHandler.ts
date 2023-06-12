type Callback<D> = (payload: D) => void;
type CallbackCollection<E extends string, D> = {
  [K in E]: Record<number, Callback<D>>;
};
type CallbackIdentifier = number;

export default class EventHandler<E extends string, D> {
  private callbacks: Partial<CallbackCollection<E, D>>;
  private counter: number;
  constructor(config?: Record<E, Callback<D> | Array<Callback<D>>>) {
    this.callbacks = {};
    this.counter = 0;
    if (config) {
      for (const [event, cbs] of Object.entries(config)) {
        if (Array.isArray(cbs)) {
          for (const cb of cbs) {
            this.on(event as E, cb);
          }
        } else {
          this.on(event as E, cbs as Callback<D>);
        }
      }
    }
  }
  on(event: E, cb: Callback<D>): CallbackIdentifier {
    this.counter++;
    let eventCallbacks = this.callbacks[event];
    if (!eventCallbacks) {
      eventCallbacks = {};
      this.callbacks[event] = eventCallbacks;
    }
    eventCallbacks[this.counter] = cb;
    return this.counter;
  }
  off(id: CallbackIdentifier) {
    if (!isCallbackIdentifier(id)) {
      throw new Error(`${id} is not a valid callback identifier`);
    }
    for (const callbacks of Object.values(this.callbacks)) {
      delete (callbacks as Record<number, Callback<D>>)[id];
    }
  }
  invokeCallbacks(event: E, payload: D) {
    for (const cb of Object.values(this.callbacks[event] ?? {})) {
      try {
        cb(payload);
      } catch (e) {
        console.error(e);
      }
    }
  }
}

function isCallbackIdentifier(id: unknown): id is CallbackIdentifier {
  return typeof id === "number";
}
