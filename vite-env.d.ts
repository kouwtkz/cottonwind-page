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
  readonly VITE_WAVEBOX?: string
  readonly VITE_AUTHOR_ACCOUNT: string
  readonly VITE_AUTHOR_EN_NAME?: string
  readonly VITE_AUTHOR_EN_PROP?: string
  readonly VITE_AUTHOR_EN_NAME_ON_PROP?: string
  readonly VITE_AUTHOR_NAME: string
  readonly VITE_AUTHOR_IMAGE: string
  readonly VITE_UPLOAD_SERVICE: string
  readonly VITE_UPLOAD_BRACKET: boolean
  readonly VITE_CONTACT_FORM_GOOGLE?: string;
  readonly VITE_RECAPTCHA_SITEKEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}