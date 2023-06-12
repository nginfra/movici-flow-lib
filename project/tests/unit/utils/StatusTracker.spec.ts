import StatusTracker from "@movici-flow-common/utils/StatusTracker";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("StatusTracker", () => {
  let tracker: StatusTracker;
  const onProgress = vi.fn();
  const onError = vi.fn();
  beforeEach(() => {
    tracker = new StatusTracker({
      tasks: { a: 30, b: 30, c: 40 },
      onProgress,
      onError,
    });
    onError.mockReset();
    onProgress.mockReset();
  });
  it("can register tasks for id", () => {
    expect(tracker.register(["a", "b"])).toEqual(0);
    expect(tracker.currentProgress).toStrictEqual({
      a: { 0: 0 },
      b: { 0: 0 },
      c: {},
    });
  });
  it("can register multiple ids", () => {
    expect(tracker.register(["a", "b"])).toEqual(0);
    expect(tracker.register(["a", "c"])).toEqual(1);
    expect(tracker.currentProgress).toStrictEqual({
      a: { 0: 0, 1: 0 },
      b: { 0: 0 },
      c: { 1: 0 },
    });
  });
  it("calculates correct progress", () => {
    const id = tracker.register(["a", "b"]);
    tracker.updateProgress(id, "a", 50);
    expect(onProgress).toHaveBeenCalledWith((50 * 30) / 100);
  });
  it("calculates progress for multiple tasks", () => {
    const id = tracker.register(["a", "b"]);
    tracker.updateProgress(id, "a", 50);
    tracker.updateProgress(id, "b", 100);
    expect(onProgress).toHaveBeenCalledWith((50 * 30 + 100 * 30) / 100);
  });
  it("calculates progress for multiple ids", () => {
    const id1 = tracker.register(["a"]);
    const id2 = tracker.register(["a"]);
    tracker.updateProgress(id1, "a", 50);
    tracker.updateProgress(id2, "a", 100);
    expect(onProgress.mock.calls[1][0]).toEqual(((50 / 2 + 100 / 2) * 30) / 100);
  });
  it("raises when id is not registered for tasks", () => {
    const id = tracker.register(["a", "b"]);
    expect(() => tracker.updateProgress(id, "c", 42)).toThrow(
      "id 0 is not registered for task 'c'"
    );
  });
  it("ignores untracked tasks", () => {
    const id = tracker.register(["untracked"]);
    tracker.updateProgress(id, "untracked", 50);
    expect(onProgress).not.toBeCalled();
  });
});
