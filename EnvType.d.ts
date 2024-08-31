declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        readonly NODE_ENV?: string;
        readonly MEDIA_UPDATE_URL_PATH?: string;
      }
    }
  }
}

declare module '*/env.toml' {
  const value: {
    FAVORITE_LINKS?: SiteLink[];
  }
  export default value
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
