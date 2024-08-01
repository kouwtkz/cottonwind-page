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