/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THEME_COLOR_KEY: string;
  readonly VITE_THEME_DARK_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}