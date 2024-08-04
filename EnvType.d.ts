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

declare module '*/favorite_links.toml' {
  const value: {
    FAVORITE_LINKS?: SiteLink[];
  }
  export default value
}

declare module '*.toml' {
  const value: unknown
  export default value
}
