interface SiteConfigEnv {
  VERSION?: string;
  ORIGIN?: string;
  TITLE?: string;
  DESCRIPTION?: string;
  OVERVIEW?: string;
  ALTERNATE?: string;
  AUTHOR_ACCOUNT?: string;
  AUTHOR_NAME?: string;
  AUTHOR_EN_NAME?: string;
  AUTHOR_EN_PROP?: string;
  AUTHOR_IMAGE?: string;
  BLUESKY_HANDLE?: string;
  TWITTER_HANDLE?: string;
  EMAIL?: string;
  SITE_IMAGE?: string;
  SINCE?: number;
  WAVEBOX?: string;
  PAGES_DEV_ORIGIN?: string;
  LOCAL_ORIGIN?: string;
  MEDIA_ORIGIN?: string;
  MEDIA_PAGES_ORIGIN?: string;
  MEDIA_LOCAL_ORIGIN?: string;
  API_ORIGIN?: string;
  API_PAGES_ORIGIN?: string;
  API_LOCAL_ORIGIN?: string;
  CONTACT_FORM_GOOGLE?: string;
  UPLOAD_BRACKET?: boolean;
  UPLOAD_SERVICE?: string;
  IMAGE_ALBUM_BLOG?: string;
  DEV?: boolean;
}
interface ImageAlbumEnvType extends Omit<ImageAlbumType, "list"> { }

interface MeeCommonEnv extends SiteConfigEnv {
  KV: KVNamespace;
  NOTICE_FEED_KV: KVNamespace;
  DB: D1Database;
  BUCKET: R2Bucket;
  CORS_ORIGIN?: string[];
  ORIGIN_HOST?: string;
  CONTACT_FORM_GOOGLE_DEV?: string;
  FEED_FROM?: string;
  LIFE_CHECK_URL?: string;
  LIFE_CHECK_CHALLENGE?: string;
  LIFE_CHECK_VERIFIER?: string;
  LOGIN_TOKEN?: string;
  [k: string]: any;
}
interface MeePagesEnv extends MeeCommonEnv {
  AUTHOR_EMAIL?: string;
  DISCORD_INVITE_QUESTION?: string;
  DISCORD_INVITE_ANSWER?: string;
  DISCORD_INVITE_URL?: string;
  FEED_DEV_FROM?: string;
  X_CLIENT_ID?: string;
  X_CLIENT_SECRET?: string;
  LIFE_CHECKER_URL?: string;
  LIFE_CHECK_CHALLENGE?: string;
  LIFE_CHECK_VERIFIER?: string;
  RECAPTCHA_SITEKEY?: string;
  RECAPTCHA_SITEKEY_DEV?: string;
}
interface MeeSvEnv extends MeeCommonEnv {
  ACCOUNT_ID?: string;
  PROJECT_NAMES?: string | string[];
  WORKERS_API_TOKEN?: string;
  EXPIRATION_DAYS?: number;
}

interface MeeBindings<T extends MeeCommonEnv = MeeCommonEnv> {
  Bindings: T;
  Response: any;
}
type MeePagesBindings = MeeBindings<MeePagesEnv>

interface MeeCommonEnv extends MeeCommonEnv {
}
type MeeAPIBindings = MeeBindings<MeeCommonEnv>;

interface MeeR2Env extends MeeCommonEnv {
  BUCKET: R2Bucket;
}

type ServerDataType = {
  discordInvite?: string;
  discordInvitePassword?: string;
}

type SiteAuthorType = {
  name: string
  account: string
  ename: string
  mail: string
  smail: string
  since: number
  x:
  {
    [name: string]: string
  }
}

type SiteMenuItemType = {
  name: string;
  short?: string;
  url?: string;
  out?: boolean;
  switch?: "theme";
}

type SiteMyLinksItemType = {
  name: string
  url: string
  title?: string
  mask?: string
  image?: string
  row?: number
  rel?: string
  hidden?: boolean
  none?: boolean
}

interface ArrayEnvType {
  NAV?: Array<SiteMenuItemType>;
  LINKS?: Array<SiteMyLinksItemType>;
  IMAGE_ALBUMS?: Array<ImageAlbumEnvType>;
}
