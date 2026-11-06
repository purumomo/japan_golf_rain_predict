import { GolfRainApp } from "@/components/golf-rain-app";
import { golfCourses } from "@/lib/courses";
import { getForecastDateBounds } from "@/lib/tee-window";

export const dynamic = "force-dynamic";

export default function Home() {
  return <GolfRainApp courses={golfCourses} bounds={getForecastDateBounds()} />;
}
