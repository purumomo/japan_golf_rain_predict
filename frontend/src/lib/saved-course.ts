import type { GolfCourse } from "./courses";

const key = "golf-rain:last-course";
const changed = "golf-rain:course-changed";

export function parseSavedCourse(raw: string | null): GolfCourse | null {
  try {
    const course = JSON.parse(raw ?? "null");
    if (!course || ["id", "name", "prefecture", "address", "sourceUrl"].some((field) => typeof course[field] !== "string")) return null;
    const match = /^osm-(node|way|relation)-([1-9]\d*)$/.exec(course.id);
    if (!match || !course.name.trim() || course.name.length > 300 || course.prefecture.length > 100 || course.address.length > 600) return null;
    if (!Number.isFinite(course.latitude) || !Number.isFinite(course.longitude)
      || course.latitude < 20 || course.latitude > 46 || course.longitude < 122 || course.longitude > 154) return null;
    if (course.sourceUrl !== `https://www.openstreetmap.org/${match[1]}/${match[2]}`) return null;
    return { id: course.id, name: course.name, prefecture: course.prefecture, address: course.address,
      latitude: course.latitude, longitude: course.longitude, sourceUrl: course.sourceUrl };
  } catch {
    return null;
  }
}

export function getSavedCourseSnapshot(): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function getServerCourseSnapshot(): null { return null; }

export function subscribeSavedCourse(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changed, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changed, onChange);
  };
}

export function rememberCourse(course: GolfCourse | null) {
  try {
    if (course) window.localStorage.setItem(key, JSON.stringify(course));
    else window.localStorage.removeItem(key);
    window.dispatchEvent(new Event(changed));
  } catch {
    // Selecting and querying a course still works when browser storage is unavailable.
  }
}
