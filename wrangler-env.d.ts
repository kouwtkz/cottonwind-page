interface MeeCommonEnv {
  KV: KVNamespace;
  NOTICE_FEED_KV: KVNamespace;
  DB: D1Database;
  ORIGIN?: string;
  AUTHOR_ACCOUNT?: string;
  [k: string]: any;
}
interface MeePagesEnv extends MeeCommonEnv {
  PAGES_DEV_URL?: string;
  AUTHOR_EMAIL?: string;
  DISCORD_INVITE_QUESTION?: string;
  DISCORD_INVITE_ANSWER?: string;
  DISCORD_INVITE_URL?: string;
  FEED_FROM?: string;
  FEED_DEV_FROM?: string;
  X_CLIENT_ID?: string;
  X_CLIENT_SECRET?: string;
  LOGIN_TOKEN?: string;
  LIFE_CHECKER_URL?: string;
  LIFE_CHECK_CHALLENGE?: string;
  LIFE_CHECK_VERIFIER?: string;
}
interface MeeBindings<T extends MeeCommonEnv = MeeCommonEnv> {
  Bindings: T
}
type MeePagesBindings = MeeBindings<MeePagesEnv>

interface MeeAPIEnv extends MeeCommonEnv { }
type MeeAPIBindings = MeeBindings<MeeAPIEnv>;
