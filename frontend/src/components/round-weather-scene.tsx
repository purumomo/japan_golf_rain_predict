import type { CSSProperties } from "react";

type SceneWeather = {
  temperatureC: number | null;
  windSpeedKmh: number | null;
  precipitationMm: number | null;
  rainMm: number | null;
  snowfallCm: number | null;
};

function CourseTree({ x, y, scale, wind }: { x: number; y: number; scale: number; wind: number | null }) {
  const moving = wind !== null && wind > 0;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <g className={moving ? "round-scene-tree" : undefined} style={{
      animationDuration: `${Math.max(1.1, 4 / (1 + (wind ?? 0) / 5))}s`,
      "--tree-sway": `${Math.min(7, (wind ?? 0) * 0.65)}deg`,
    } as CSSProperties}>
      <path d="M0 47 L3 0" stroke="#648169" strokeWidth="6" />
      <path d="M-25 9 Q-34 -17 -12 -26 Q-8 -49 13 -37 Q37 -42 37 -18 Q54 1 30 16 Q10 29 -9 18Z" fill="#608b6e" />
      <path d="M-7 -16 Q8 -23 23 -10" fill="none" stroke="#83a181" strokeWidth="3" />
    </g>
  </g>;
}

export function RoundWeatherScene({ weather, paused }: { weather: SceneWeather; paused: boolean }) {
  const wind = weather.windSpeedKmh == null ? null : weather.windSpeedKmh / 3.6;
  const moving = wind !== null && wind > 0;
  const windDuration = `${Math.max(0.6, 3.5 / (1 + (wind ?? 0) / 3))}s`;
  const rain = weather.rainMm ?? 0;
  const snow = weather.snowfallCm ?? 0;
  const drops = rain <= 0 ? 0 : rain < 1 ? 10 : rain < 3 ? 22 : rain < 10 ? 36 : 52;
  const flakes = snow <= 0 ? 0 : snow < 1 ? 18 : snow < 3 ? 32 : 48;
  const cool = weather.temperatureC !== null && weather.temperatureC < 10;
  const warm = weather.temperatureC !== null && weather.temperatureC >= 25;

  return <svg viewBox="0 0 600 340" className={`round-weather-scene block w-full ${paused ? "round-scene-paused" : ""}`} aria-hidden="true">
    <rect width="600" height="340" fill={snow > 0 || cool ? "#dce7ed" : warm ? "#f3eddb" : "#e6efe7"} />
    <path d="M0 130 Q100 100 207 129 T426 114 T600 123 V340 H0Z" fill="#c7d8c2" />
    <path d="M0 173 Q100 114 230 156 T450 135 T600 159 V340 H0Z" fill="#9dbb98" />
    <path d="M0 236 Q160 153 300 206 T600 185 V340 H0Z" fill="#739c78" />
    <path d="M115 340 Q235 265 299 228 Q329 201 382 175 L444 178 Q398 208 390 235 Q373 278 469 340Z" fill="#bfd69b" />
    <path d="M190 340 Q266 280 324 242 Q362 216 392 190" fill="none" stroke="#d7e2b6" strokeWidth="2" opacity="0.6" />
    <path d="M430 238 Q474 219 504 236 Q526 249 494 258 Q451 274 430 255 Q418 246 430 238Z" fill="#e6d8b9" />
    <path d="M441 240 Q469 230 491 239" fill="none" stroke="#d7c6a4" strokeWidth="2" />
    <ellipse cx="396" cy="185" rx="54" ry="18" fill="#d3e3af" />
    <ellipse cx="399" cy="190" rx="7" ry="2.5" fill="#426649" />
    <path d="M399 188 V112" stroke="#fffdf1" strokeWidth="3" />
    <g transform="translate(400 113)">
      <path className={moving ? "round-scene-flag" : undefined} style={{ animationDuration: windDuration }} d="M0 0 Q16 -3 40 10 Q18 10 0 22Z" fill="#da805d" />
    </g>
    {[
      [35, 164, 0.6], [83, 141, 1], [139, 174, 0.65],
      [476, 139, 0.65], [528, 172, 0.82], [579, 201, 0.7],
      [22, 262, 1.1], [552, 277, 1.05],
    ].map(([x, y, scale]) => <CourseTree key={`${x}-${y}`} x={x} y={y} scale={scale} wind={wind} />)}
    <g fill="none" stroke="#edf5e6" strokeWidth="1.7" opacity="0.8">
      {moving ? Array.from({ length: 6 }, (_, index) => <path key={index} className="round-scene-wind" d={`M-100 ${104 + index * 29} h55 q16 0 16 -8`} style={{ animationDuration: windDuration, animationDelay: `${-index * 0.38}s` }} />) : null}
    </g>
    <ellipse cx="225" cy="303" rx="38" ry="7" fill="#507653" opacity="0.3" />
    <g className="round-scene-golfer">
      <g transform="translate(225 251)">
        <g className="round-scene-leg">
          <path d="M-4 0 L-8 25 L-21 48" fill="none" stroke="#364b4b" strokeWidth="12" strokeLinecap="round" />
          <path d="M-25 46 L-10 50 L-10 55 H-31 Q-33 50 -25 46Z" fill="#f5f2e6" />
        </g>
        <g className="round-scene-leg round-scene-leg-back">
          <path d="M5 0 L13 25 L18 49" fill="none" stroke="#435d58" strokeWidth="12" strokeLinecap="round" />
          <path d="M13 46 L25 48 L33 55 H10Z" fill="#f5f2e6" />
        </g>
      </g>
      <g transform="translate(227 210)">
        <path d="M13 8 Q38 5 39 37 L34 61 H17Z" fill="#b59670" stroke="#7e795d" strokeWidth="1.5" />
        <path d="M27 9 L23 -20 M35 13 L37 -12" stroke="#50645a" strokeWidth="2" />
        <path d="M18 -20 H28 M34 -13 H43" stroke="#50645a" strokeWidth="4" strokeLinecap="round" />
        <path d="M24 11 Q2 2 0 17 L20 39" fill="none" stroke="#707f65" strokeWidth="4" />
      </g>
      <path d="M214 214 Q225 207 236 216 L239 253 Q226 260 212 253Z" fill={cool ? "#6f8e9c" : warm ? "#f1dfbd" : "#ece6cf"} />
      <path d="M217 214 L224 222 L231 214" fill="#fffaf0" />
      <g transform="translate(219 218)">
        <g className="round-scene-arm">
          <path d="M0 0 L-12 21 L-2 33" fill="none" stroke={cool ? "#6f8e9c" : "#ece6cf"} strokeWidth="10" strokeLinecap="round" />
          <path d="M-2 33 L3 37" stroke="#d9af8c" strokeWidth="7" strokeLinecap="round" />
        </g>
      </g>
      <path d="M222 204 V215" stroke="#d9af8c" strokeWidth="9" />
      <circle cx="224" cy="195" r="13" fill="#d9af8c" />
      <path d="M210 193 Q209 177 225 179 Q238 179 238 190 L222 187 L213 194Z" fill="#344d45" />
      <path d="M211 183 Q222 173 234 184 L242 189 H212Z" fill="#f9f5e9" />
      <path d="M233 196 H236" stroke="#6d7562" strokeWidth="2" strokeLinecap="round" />
    </g>
    <g stroke="#76a7b5" strokeWidth={rain >= 3 ? 2 : 1.5} strokeLinecap="round" opacity="0.65">
      {Array.from({ length: drops }, (_, index) => <line key={index} className="round-scene-rain" x1={(index * 97 + 31) % 650} y1="-25" x2={(index * 97 + 31) % 650 - 7} y2="-9" style={{ animationDuration: `${rain >= 3 ? 0.65 : 1.1}s`, animationDelay: `${-index * 0.17}s` }} />)}
    </g>
    <g fill="#fff" stroke="#b5cbd5" strokeWidth="0.5">
      {Array.from({ length: flakes }, (_, index) => <g key={index} transform={`translate(${(index * 83 + 17) % 650} -12)`}>
        <g className="round-scene-snow" style={{
          animationDuration: `${4.5 + index % 4 * 0.7}s`, animationDelay: `${-index * 0.47}s`,
          "--snow-drift": `${moving ? -25 - Math.min(65, (wind ?? 0) * 5) : -12}px`,
        } as CSSProperties}>
          {index % 3 === 0 ? <path d="M-4 0 H4 M0 -4 V4 M-3 -3 L3 3 M-3 3 L3 -3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            : <circle r={1.8 + index % 3 * 0.6} />}
        </g>
      </g>)}
    </g>
    <path d="M29 327 L35 319 M36 329 L45 319 M559 303 L565 292 M566 306 L575 296" stroke="#c1d49e" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}
