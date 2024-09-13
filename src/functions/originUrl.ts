export function concatOriginUrl(origin?: string, src?: OrNull<string>) {
  if (origin && src) {
    return origin + (src.startsWith("/") ? "" : "/") + src;
  } else return "";
}

export function getAPIOrigin(env: SiteConfigEnv, origin: string) {
  if (env.ORIGIN === origin) {
    return env.API_ORIGIN;
  } else if (env.PAGES_DEV_ORIGIN === origin) {
    return env.API_WORKERS_ORIGIN;
  } else {
    return env.API_LOCAL_ORIGIN;
  }
}

export function getMediaOrigin(env: SiteConfigEnv, origin: string) {
  if (env.ORIGIN === origin) {
    return env.MEDIA_ORIGIN;
  } else if (env.PAGES_DEV_ORIGIN === origin) {
    return env.MEDIA_WORKERS_ORIGIN;
  } else {
    return env.MEDIA_LOCAL_ORIGIN;
  }
}
