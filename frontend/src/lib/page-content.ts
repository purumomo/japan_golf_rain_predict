import type { Language } from "./language";

export const pageContent: Record<Language, {
  title: string;
  description: string;
  locale: string;
  aboutTitle: string;
  aboutBody: string;
  aboutHelp: string;
}> = {
  ja: {
    title: "Golf Rain｜日本のゴルフ場の天気・雨予報・風速",
    description: "日本のゴルフ場を検索して、スタートから約5時間の雨予報を確認。1時間ごとの降水確率・降水量・風速と雨のアニメーションで、ラウンド前の雨具や服装の準備に役立ちます。",
    locale: "ja_JP",
    aboutTitle: "ゴルフ場の雨予報を、プレーする時間に合わせて確認",
    aboutBody: "Golf Rainは、日本のゴルフ場の天気をラウンド時間に合わせて確認できるサービスです。ゴルフ場を検索し、プレー日とスタート時間を選ぶと、約5時間の降水確率・降水量・風速を1時間ごとに表示します。東京周辺の千葉・埼玉・山梨・群馬・栃木をはじめ、日本国内のコースを検索できます。",
    aboutHelp: "雨量のアニメーションと時間別のグラフで、どの時間にどれくらいの雨が予想されるかを確認できます。レインウェアや予備のグローブなど、出発前の準備にお役立てください。予報はOpen-Meteoのデータを使用しており、当日の天気やプレー可否を保証するものではありません。",
  },
  zh: {
    title: "日本高尔夫球场天气、降雨预报与风速查询｜Golf Rain",
    description: "搜索日本高尔夫球场，查看开球后约5小时的天气预报。逐小时显示下雨可能性、雨量和风速，配合降雨动画，帮助你出发前准备雨衣、手套和打球装备。",
    locale: "zh_CN",
    aboutTitle: "按打球时间，查看日本高尔夫球场的降雨预报",
    aboutBody: "Golf Rain 帮你查看打球那几个小时的天气。搜索并选择日本高尔夫球场，设置日期和开球时间，就能看到接下来约5小时的下雨可能性、雨量和风速。支持搜索日本国内球场，包括东京周边的千叶、埼玉、山梨、群马和栃木。",
    aboutHelp: "用降雨动画感受雨有多大，再通过每小时的蓝条比较雨量，提前准备雨衣、备用手套等装备。天气数据来自 Open-Meteo，出发前记得再查一次；当天能否正常打球，还要看球场通知和现场情况。",
  },
  en: {
    title: "Japan Golf Course Weather, Rain Forecast & Wind | Golf Rain",
    description: "Find a golf course in Japan and check hourly rain chances, rainfall and wind for your five-hour round. Use rain animations to help plan what to pack.",
    locale: "en_US",
    aboutTitle: "Check golf course rain forecasts for the hours you plan to play",
    aboutBody: "Golf Rain shows weather forecasts for your round at golf courses in Japan. Search for a course, choose a date and tee time, then check hourly rain chances, rainfall and wind over an estimated five-hour round. Search courses across Japan, including Chiba, Saitama, Yamanashi, Gunma and Tochigi near Tokyo.",
    aboutHelp: "Rain animations help illustrate the amount of rain, while hourly bars let you compare the wetter parts of your round. Use them to plan waterproofs, spare gloves and other equipment. Forecasts come from Open-Meteo; check again before departure and confirm conditions with the course on the day.",
  },
};
