export const CABINET_THEME_KEY = "cabinet-theme";

export type CabinetTheme = "light" | "dark";

export function getCabinetTheme(): CabinetTheme {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(CABINET_THEME_KEY) === "dark" ? "dark" : "light";
}

export function setCabinetTheme(theme: CabinetTheme) {
  localStorage.setItem(CABINET_THEME_KEY, theme);
}
