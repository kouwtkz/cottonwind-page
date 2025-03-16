import React from "react";
import { ThemeStateClass } from "@/components/theme/ThemeSetter";
import { CreateState } from "@/state/CreateState";

export const ThemeState = new ThemeStateClass(
  import.meta.env!.VITE_THEME_COLOR_KEY,
  ["theme-orange", "theme-aqua"]
);
export const DarkThemeState = new ThemeStateClass(
  import.meta.env!.VITE_THEME_DARK_KEY,
  ["dark", "auto"]
);
export const useDarkMode = CreateState();

export function Theme() {
  const theme = DarkThemeState.use().theme;
  const setDarkMode = useDarkMode()[1];
  React.useEffect(() => {
    if (theme === "auto")
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    else setDarkMode(theme === "dark");
  }, [theme]);
  return (
    <>
      {ThemeState.State()}
      {DarkThemeState.State()}
    </>
  );
}
