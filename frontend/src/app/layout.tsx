import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPreferredLanguage } from "@/lib/language";
import { pageContent } from "@/lib/page-content";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const language = getPreferredLanguage((await headers()).get("accept-language"));
  const { title, description, locale } = pageContent[language];

  return {
    title,
    description,
    openGraph: { title, description, locale, siteName: "Golf Rain", type: "website" },
    twitter: { card: "summary", title, description },
    icons: {
      icon: { url: "/3ebfbb46-9eea-4e67-aa99-cddfd9db2b22.png", type: "image/png" },
      apple: "/3ebfbb46-9eea-4e67-aa99-cddfd9db2b22.png",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const language = getPreferredLanguage((await headers()).get("accept-language"));
  return (
    <html lang={language === "zh" ? "zh-CN" : language}>
      <body>{children}</body>
    </html>
  );
}
