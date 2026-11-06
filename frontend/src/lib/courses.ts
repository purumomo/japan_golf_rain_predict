import courseData from "@/data/courses.json";

export type GolfCourse = {
  id: string;
  name: string;
  prefecture: string;
  latitude: number;
  longitude: number;
};

type CourseDataset = {
  retrievedAt: string;
  attribution: string;
  courses: GolfCourse[];
};

const dataset = courseData as CourseDataset;

export const courseDatasetAttribution = dataset.attribution;
export const courseDatasetRetrievedAt = dataset.retrievedAt;
export const golfCourses = [...dataset.courses].sort((left, right) => {
  if (left.prefecture === right.prefecture) {
    return left.name.localeCompare(right.name, "ja");
  }

  return left.prefecture.localeCompare(right.prefecture, "ja");
});

export function getCourseById(courseId: string) {
  return golfCourses.find((course) => course.id === courseId);
}

export function searchCourses(query: string) {
  const trimmedQuery = query.trim().toLocaleLowerCase("ja-JP");

  if (!trimmedQuery) {
    return golfCourses;
  }

  return golfCourses.filter((course) => {
    const haystack = `${course.name} ${course.prefecture}`.toLocaleLowerCase("ja-JP");
    return haystack.includes(trimmedQuery);
  });
}
