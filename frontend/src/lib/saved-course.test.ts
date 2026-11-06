import { afterEach, describe, expect, it, vi } from "vitest";

import { getSavedCourseSnapshot, getServerCourseSnapshot, parseSavedCourse, rememberCourse, subscribeSavedCourse } from "./saved-course";

const course = { id: "osm-way-123", name: "Selected online course", prefecture: "千葉県", address: "千葉県",
  latitude: 35.5, longitude: 140.2, sourceUrl: "https://www.openstreetmap.org/way/123" };

afterEach(() => vi.unstubAllGlobals());

describe("last selected course in browser storage", () => {
  it("restores the selected provider result and its attribution", () => {
    expect(parseSavedCourse(JSON.stringify(course))).toEqual(course);
    expect(getServerCourseSnapshot()).toBeNull();
  });

  it("ignores corrupt, invalid and forged saved results", () => {
    for (const raw of [null, "broken", "null", "{}", JSON.stringify({ ...course, latitude: "35.5" }),
      JSON.stringify({ ...course, longitude: 0 }), JSON.stringify({ ...course, name: "" }),
      JSON.stringify({ ...course, sourceUrl: "javascript:alert(1)" }),
      JSON.stringify({ ...course, sourceUrl: "https://www.openstreetmap.org/way/456" })]) {
      expect(parseSavedCourse(raw)).toBeNull();
    }
  });

  it("saves, notifies subscribers, restores and forgets the course", () => {
    const entries = new Map<string, string>();
    const browser = Object.assign(new EventTarget(), { localStorage: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => { entries.set(key, value); },
      removeItem: (key: string) => { entries.delete(key); },
    } });
    vi.stubGlobal("window", browser);
    const notify = vi.fn();
    const unsubscribe = subscribeSavedCourse(notify);
    rememberCourse(course);
    expect(parseSavedCourse(getSavedCourseSnapshot())).toEqual(course);
    expect(notify).toHaveBeenCalledTimes(1);
    rememberCourse(null);
    expect(getSavedCourseSnapshot()).toBeNull();
    expect(notify).toHaveBeenCalledTimes(2);
    unsubscribe();
    rememberCourse(course);
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it("keeps the app usable when storage access is blocked", () => {
    vi.stubGlobal("window", { get localStorage() { throw new Error("Storage unavailable"); } });
    expect(getSavedCourseSnapshot()).toBeNull();
    expect(() => rememberCourse(course)).not.toThrow();
    expect(() => rememberCourse(null)).not.toThrow();
  });
});
