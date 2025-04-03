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
  readonly VITE_THEME_COLOR_KEY: string;
  readonly VITE_THEME_DARK_KEY: string;
  readonly VITE_LOCAL_TEST_DOMAIN?: string;
  readonly VITE_LOCAL_TEST_DOMAIN_2?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}