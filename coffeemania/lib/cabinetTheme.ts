export const CABINET_THEME_KEY = "cabinet-theme";

export type CabinetTheme = "light" | "dark";

export function getCabinetTheme(): CabinetTheme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(CABINET_THEME_KEY);
  return stored === "light" ? "light" : "dark";
}

export function setCabinetTheme(theme: CabinetTheme) {
  localStorage.setItem(CABINET_THEME_KEY, theme);
}
