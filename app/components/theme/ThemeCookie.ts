export function CookieToThemeClassNames(cookie: {
  [k: string]: string | undefined;
}) {
  const classNames: string[] = [];
  if (cookie[import.meta.env.VITE_THEME_COLOR_KEY]) {
    classNames.push(cookie[import.meta.env.VITE_THEME_COLOR_KEY]!);
  }
  if (cookie[import.meta.env.VITE_THEME_DARK_KEY]) {
    classNames.push(cookie[import.meta.env.VITE_THEME_DARK_KEY]!);
  }
  return classNames;
}
