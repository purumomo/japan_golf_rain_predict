import { describe, expect, it } from "vitest";

import { LatestRequest } from "./latest-request";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe("forecast request ownership", () => {
  it("ignores an old response even when cancellation does not stop delivery", async () => {
    const requests = new LatestRequest();
    const oldResponse = deferred<string>();
    const old = requests.start();
    let forecast = "";
    const completion = oldResponse.promise.then((value) => {
      if (old.isCurrent()) forecast = value;
    });
    const latest = requests.start();
    expect(old.signal.aborted).toBe(true);
    expect(latest.signal.aborted).toBe(false);
    if (latest.isCurrent()) forecast = "new course, date and time";
    oldResponse.resolve("old forecast");
    await completion;
    expect(forecast).toBe("new course, date and time");
  });

  it("ignores stale errors and finalizers while a newer request is loading", async () => {
    const requests = new LatestRequest();
    const response = deferred<string>();
    const old = requests.start();
    let error = "";
    let loading = true;
    const completion = response.promise.catch(() => {
      if (old.isCurrent()) error = "failed";
    }).finally(() => {
      if (old.isCurrent()) loading = false;
    });
    requests.start();
    response.reject(new Error("old network failure"));
    await completion;
    expect(error).toBe("");
    expect(loading).toBe(true);
  });

  it("invalidates requests on condition changes or unmount, and can start again", () => {
    const requests = new LatestRequest();
    const old = requests.start();
    requests.cancel();
    requests.cancel();
    expect(old.signal.aborted).toBe(true);
    expect(old.isCurrent()).toBe(false);
    expect(requests.start().isCurrent()).toBe(true);
    expect(old.isCurrent()).toBe(false);
  });
});
