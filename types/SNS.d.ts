interface EmbedSNSprops {
  width?: number;
  height?: number;
  lang?: string;
}
type BlueskyThemeType = "light" | "gray" | "dark";
type BlueskyUIType = 0 | 1 | 2 | "default" | "compact" | "minimum";
type BlueskyPropType = 0 | 1 | 2 | "hide" | "default" | "minimum";
interface EmbedBlueskyProps extends EmbedSNSprops {
  q?: string;
  id?: string;
  pin?: boolean;
  theme?: BlueskyThemeType;
  ui?: BlueskyUIType;
  prof?: BlueskyPropType;
  rp?: boolean;
  thread?: boolean;
}
