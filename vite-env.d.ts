/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_TIME?: string
  readonly VITE_STYLES_TIME?: string
  readonly VITE_URL: string
  readonly VITE_TITLE: string
  readonly VITE_SINCE: string
  readonly VITE_DESCRIPTION: string
  readonly VITE_OVERVIEW: string
  readonly VITE_ALTERNATE: string
  readonly VITE_SITE_IMAGE: string
  readonly VITE_WAVEBOX: string
  readonly VITE_AUTHOR_ACCOUNT: string
  readonly VITE_AUTHOR_ENAME: string
  readonly VITE_AUTHOR_NAME: string
  readonly VITE_AUTHOR_IMAGE: string
  readonly VITE_UPLOAD_SERVICE: string
  readonly VITE_UPLOAD_BRACKET: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}