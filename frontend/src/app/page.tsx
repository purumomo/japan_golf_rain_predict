import { headers } from "next/headers";

import { GolfRainApp } from "@/components/golf-rain-app";
import { getPreferredLanguage } from "@/lib/language";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialLanguage = getPreferredLanguage((await headers()).get("accept-language"));

  return (
    <GolfRainApp
      initialLanguage={initialLanguage}
    />
  );
}
