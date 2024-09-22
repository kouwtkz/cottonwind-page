import { ThemeConfig } from "react-select";

export const callReactSelectTheme: ThemeConfig = (theme) => ({
  ...theme,
  borderRadius: 10,
  colors: {
    ...theme.colors,
    primary: "var(--main-color-deep)",
    primary25: "var(--main-color-pale)",
    primary50: "var(--main-color-soft)",
    primary75: "var(--main-color)",
    neutral0: "var(--form-background-color)",
  },
});
