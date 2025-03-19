/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THEME_COLOR_KEY: string;
  readonly VITE_THEME_DARK_KEY: string;
  readonly VITE_KVDB_KEY_AUTHOR_NAME: string;
  readonly VITE_KVDB_KEY_AUTHOR_NAME_EN: string;
  readonly VITE_KVDB_KEY_AUTHOR_NAME_EN_PROP: string;
  readonly VITE_KVDB_KEY_AUTHOR_IMAGE: string;
  readonly VITE_KVDB_KEY_AUTHOR_DESCRIPTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}