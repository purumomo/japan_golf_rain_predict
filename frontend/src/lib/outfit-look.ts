const palettes = [
  { top: "#eee4ce", outer: "#739785", trousers: "#344e55", accent: "#c19c71", hair: "#423c36", skin: "#dfb492" },
  { top: "#d6e4e9", outer: "#56728e", trousers: "#35445c", accent: "#bd8468", hair: "#292f36", skin: "#bc8868" },
  { top: "#f1dfd5", outer: "#b77765", trousers: "#65544d", accent: "#dfc392", hair: "#775343", skin: "#edc7ac" },
  { top: "#e1dcee", outer: "#8b7b9d", trousers: "#49485c", accent: "#b7c6a4", hair: "#38312e", skin: "#96674d" },
  { top: "#e9e6d4", outer: "#ad926a", trousers: "#59654b", accent: "#67857e", hair: "#675249", skin: "#d5a281" },
  { top: "#e3e8eb", outer: "#607b7e", trousers: "#414a52", accent: "#bd8c97", hair: "#282b2e", skin: "#f0c8a7" },
] as const;

export const OUTFIT_LOOK_COUNT = palettes.length * 4;

export function getOutfitLook(index: number) {
  const normalized = ((index % OUTFIT_LOOK_COUNT) + OUTFIT_LOOK_COUNT) % OUTFIT_LOOK_COUNT;
  return {
    ...palettes[Math.floor(normalized / 2) % palettes.length],
    gender: normalized % 2 === 0 ? "male" as const : "female" as const,
    tailored: normalized >= palettes.length * 2,
    pattern: Math.floor(normalized / 2) % 3,
  };
}

export type OutfitLook = ReturnType<typeof getOutfitLook>;

export function randomizeOutfitLook(current: number, random = Math.random) {
  // Choose another visual style; the weather-derived garments are never randomized.
  return (current + 1 + Math.floor(random() * (OUTFIT_LOOK_COUNT - 1))) % OUTFIT_LOOK_COUNT;
}
