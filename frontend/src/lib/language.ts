export type Language = "ja" | "zh" | "en";

export function getPreferredLanguage(acceptLanguage: string | null): Language {
  const preferences = (acceptLanguage ?? "").split(",").map((entry) => {
    const [tag, ...parameters] = entry.trim().toLowerCase().split(";");
    const quality = parameters.map((parameter) => parameter.trim()).find((parameter) => parameter.startsWith("q="));
    return { language: tag.split("-")[0], quality: quality ? Number(quality.slice(2)) : 1 };
  }).filter(({ quality }) => Number.isFinite(quality) && quality > 0 && quality <= 1)
    .sort((a, b) => b.quality - a.quality);

  for (const { language } of preferences) {
    if (language === "ja" || language === "zh" || language === "en") return language;
  }

  return "ja";
}
