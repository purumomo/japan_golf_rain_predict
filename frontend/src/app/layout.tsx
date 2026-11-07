import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPreferredLanguage } from "@/lib/language";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://teeweather.app"),
  title: "TeeWeather | Golf Weather Forecast & Outfit Planner",
  description:
    "Check golf course weather worldwide, including rain, wind and temperature forecasts. Get personalized golf outfit recommendations before your round.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "TeeWeather | Golf Weather & Outfit Planner",
    description:
      "Worldwide golf course weather forecasts and personalized golf outfit recommendations.",
    url: "https://teeweather.app",
    siteName: "TeeWeather",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TeeWeather | Golf Weather & Outfit Planner",
    description:
      "Worldwide golf course weather forecasts and personalized golf outfit recommendations.",
  },
  icons: {
    icon: { url: "/3ebfbb46-9eea-4e67-aa99-cddfd9db2b22.png", type: "image/png" },
    apple: "/3ebfbb46-9eea-4e67-aa99-cddfd9db2b22.png",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const language = getPreferredLanguage((await headers()).get("accept-language"));
  return (
    <html lang={language === "zh" ? "zh-CN" : language}>
      <body>{children}</body>
    </html>
  );
}
