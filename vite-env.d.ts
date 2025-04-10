/// <reference types="vite/client" />

interface ImportMetaKVKeyEnv {
  readonly VITE_KVDB_KEY_AUTHOR_NAME: string;
  readonly VITE_KVDB_KEY_AUTHOR_NAME_EN: string;
  readonly VITE_KVDB_KEY_AUTHOR_NAME_EN_PROP: string;
  readonly VITE_KVDB_KEY_AUTHOR_IMAGE: string;
  readonly VITE_KVDB_KEY_AUTHOR_DESCRIPTION: string;
}
type ImportMetaKVKeyType = keyof ImportMetaKVKeyEnv;

interface ImportMetaEnv extends ImportMetaKVKeyEnv {
  readonly VITE_CLIENT_SCRIPT: string;
  readonly VITE_CLIENT_BEFORE_SCRIPT?: string;
  readonly VITE_PATH_SW_NOTIFICATION: string;
  readonly VITE_THEME_COLOR_KEY: string;
  readonly VITE_THEME_DARK_KEY: string;
  readonly VITE_LOCAL_TEST_DOMAIN?: string;
  readonly VITE_LOCAL_TEST_DOMAIN_2?: string;
  readonly VITE_STORAGE_KEY_SW?: string;
  readonly VITE_VERSION_SW_CALENDAR?: string;
  readonly VITE_INDEXEDDB_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}