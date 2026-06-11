"use client";

import { useCallback, useEffect, useState } from "react";
import { getCabinetTheme, setCabinetTheme, type CabinetTheme } from "@/lib/cabinetTheme";

export function applySiteTheme(theme: CabinetTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
}

export function useSiteTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = getCabinetTheme();
    setIsDark(theme === "dark");
    applySiteTheme(theme);
  }, []);

  const setTheme = useCallback((nextDark: boolean) => {
    const theme: CabinetTheme = nextDark ? "dark" : "light";
    setIsDark(nextDark);
    setCabinetTheme(theme);
    applySiteTheme(theme);
  }, []);

  return { isDark, setTheme };
}
