import PromiseStore from "@movici-flow-lib/utils/PromiseStore";
import { beforeAll, describe, expect, it, vi } from "vitest";

describe("PromiseStore", () => {
  function makePromise() {
    return new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
  beforeAll(() => {
    vi.useFakeTimers();
  });

  it("can retrieve pending promise", () => {
    const store = new PromiseStore<string, unknown>((k: string) => k);
    const mock = vi.fn();
    store.add("some-key", makePromise(), mock);
    expect(store.get("some-key")).toBeInstanceOf(Promise);
  });
  it("removes promise on success", async () => {
    const store = new PromiseStore<string, unknown>((k: string) => k);
    const mock = vi.fn();
    store.add("some-key", makePromise(), mock);
    await vi.runAllTimersAsync();

    expect(store.get("some-key")).toBeNull();
  });
  it("calls on success when not cleared", async () => {
    const store = new PromiseStore<string, unknown>((k: string) => k);
    const mock = vi.fn();
    store.add("some-key", makePromise(), mock);
    await vi.runAllTimersAsync();
    expect(mock).toHaveBeenCalledOnce();
  });
  it("clears promise on clear", async () => {
    const store = new PromiseStore<string, unknown>((k: string) => k);
    const mock = vi.fn();
    store.add("some-key", makePromise(), mock);
    store.clear();
    expect(store.get("some-key")).toBeNull();
  });
  it("doesnt call on success when cleared", async () => {
    const store = new PromiseStore<string, unknown>((k: string) => k);
    const mock = vi.fn();
    store.add("some-key", makePromise(), mock);
    store.clear();
    await vi.runAllTimersAsync();
    expect(mock).not.toHaveBeenCalledOnce();
  });
});
