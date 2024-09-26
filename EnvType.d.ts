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

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}

declare async function generateStaticParams<T = any>(env?: T): KeyValueType[];
