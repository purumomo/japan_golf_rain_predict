import type { Language } from "./language";

export const pageContent: Record<Language, {
  title: string;
  description: string;
  locale: string;
}> = {
  ja: {
    title: "Golf Rain｜日本のゴルフ場の天気・雨予報・風速",
    description: "日本のゴルフ場を検索して、スタートから約5時間の気温・降水確率・雨量・風速を確認。雨のアニメーションとウェアの提案で、ラウンド前の服装や雨具の準備に役立ちます。天気データはOpen-Meteoを使用しています。",
    locale: "ja_JP",
  },
  zh: {
    title: "日本高尔夫球场天气、降雨预报与风速查询｜Golf Rain",
    description: "搜索日本高尔夫球场，按开球时间查看约5小时的气温、下雨可能性、雨量和风速。配合降雨动画和穿搭建议，提前准备衣物与雨具。天气数据来自 Open-Meteo，支持搜索东京周边及日本国内球场。",
    locale: "zh_CN",
  },
  en: {
    title: "Japan Golf Course Weather, Rain Forecast & Wind | Golf Rain",
    description: "Check hourly temperature, rain and wind for your golf round in Japan. Rain animations and outfit tips help you pack. Forecasts from Open-Meteo.",
    locale: "en_US",
  },
};
