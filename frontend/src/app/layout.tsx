import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golf Rain",
  description:
    "Golf Rain is a mobile-first Japanese golf weather app for checking hourly rain risk during a five-hour round.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
