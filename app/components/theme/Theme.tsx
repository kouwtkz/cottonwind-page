import React, { useMemo } from "react";
import { ThemeStateClass } from "~/components/theme/ThemeSetter";
import { CreateState } from "~/components/state/CreateState";
import { ThemeChangeButtonProps } from "~/components/theme/ThemeSetter";
import { CgDarkMode, CgMoon, CgSun } from "react-icons/cg";
import { PiDrop, PiLeaf, PiOrangeSlice } from "react-icons/pi";

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

export function ThemeChangeButton({
  children,
  className = "theme item",
  title = "テーマカラー切り替え",
  "aria-label": ariaLabel = "switch",
  ...args
}: ThemeChangeButtonProps) {
  const { theme: colortheme } = ThemeState.use();
  const { next } = ThemeState.use();
  children = useMemo(
    () =>
      children ??
      (colortheme === "theme-orange" ? (
        <PiOrangeSlice />
      ) : colortheme === "theme-aqua" ? (
        <PiDrop />
      ) : (
        <PiLeaf />
      )),
    [children, colortheme]
  );
  return (
    <button
      {...args}
      className={className}
      aria-label={ariaLabel}
      title={title}
      onClick={next}
    >
      {children}
    </button>
  );
}

export function DarkThemeChangeButton({
  children,
  className = "theme item",
  title = "ダークテーマ切り替え",
  "aria-label": ariaLabel = "switch",
  ...args
}: ThemeChangeButtonProps) {
  const { theme: darktheme } = DarkThemeState.use();
  const { next } = DarkThemeState.use();
  children = useMemo(
    () =>
      children ??
      (darktheme === "auto" ? (
        <CgDarkMode />
      ) : darktheme === "dark" ? (
        <CgMoon />
      ) : (
        <CgSun />
      )),
    [children, darktheme]
  );
  return (
    <button
      {...args}
      className={className}
      aria-label={ariaLabel}
      title={title}
      onClick={next}
    >
      {children}
    </button>
  );
}
