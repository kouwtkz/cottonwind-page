/// <reference types="vite/client" />

interface ImportMetaKVKeyEnv {
  readonly VITE_KVDB_KEY_AUTHOR_NAME: string;
  readonly VITE_KVDB_KEY_AUTHOR_NAME_EN: string;
  readonly VITE_KVDB_KEY_AUTHOR_NAME_EN_PROP: string;
  readonly VITE_KVDB_KEY_AUTHOR_IMAGE: string;
  readonly VITE_KVDB_KEY_AUTHOR_DESCRIPTION: string;
  readonly VITE_KVDB_KEY_GUIDELINE: string;
  readonly VITE_KVDB_KEY_WORKS_STATUS: string;
  readonly VITE_KVDB_KEY_WORKS_PRICE: string;
}
type ImportMetaKVKeyType = keyof ImportMetaKVKeyEnv;

interface ImportMetaEnv extends ImportMetaKVKeyEnv {
  readonly VITE_DOMAIN: string;
  readonly VITE_DEFAULT_LANG: string;
  readonly VITE_TITLE: string;
  readonly VITE_TITLE_EN: string;
  readonly VITE_CSS_STYLES: string;
  readonly VITE_CSS_LIB: string;
  readonly VITE_SSG_BEFORE_CLIENT: string;
  readonly VITE_PATH_SW_NOTIFICATION: string;
  readonly VITE_PATH_WK_COUNTDOWN: string;
  readonly VITE_THEME_COLOR_KEY: string;
  readonly VITE_THEME_DARK_KEY: string;
  readonly VITE_LOCAL_TEST_DOMAIN?: string;
  readonly VITE_LOCAL_TEST_DOMAIN_2?: string;
  readonly VITE_STORAGE_KEY_SW?: string;
  readonly VITE_VERSION_SW_CALENDAR?: string;
  readonly VITE_INDEXEDDB_NAME: string;
  readonly VITE_CALENDAR_CONFIG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}