import { cookies } from "next/headers";

import { GolfRainApp } from "@/components/golf-rain-app";
import { getForecastDateBounds } from "@/lib/tee-window";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const storedLanguage = cookieStore.get("golf-rain-language")?.value;
  const initialLanguage = storedLanguage === "zh" || storedLanguage === "en" ? storedLanguage : "ja";

  return (
    <GolfRainApp
      bounds={getForecastDateBounds()}
      initialLanguage={initialLanguage}
    />
  );
}
