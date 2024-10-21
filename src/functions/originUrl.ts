export function concatOriginUrl(origin?: string, src?: OrNull<string>) {
  if (src) {
    return (origin || "") + (src.startsWith("/") ? "" : "/") + src;
  } else return "";
}

export function getLocalOrigin(origin: string, envLocalOrigin?: string) {
  if (envLocalOrigin) {
    if (!isNaN(Number(envLocalOrigin))) {
      const url = new URL(origin);
      url.port = envLocalOrigin;
      return url.origin;
    } else return envLocalOrigin;
  } else return undefined;
}

export function getOriginFromAPI(env: SiteConfigEnv, origin: string) {
  if (env.API_ORIGIN === origin) {
    return env.ORIGIN;
  } else if (env.DEV) {
    return getLocalOrigin(origin, env.LOCAL_ORIGIN);
  } else return env.PAGES_DEV_ORIGIN;
}

export function getAPIOrigin(env: SiteConfigEnv, origin: string) {
  if ((env.API_ORIGIN && !env.API_ORIGIN.match("://"))) {
    return new URL(env.API_ORIGIN, origin).href;
  } if (env.ORIGIN === origin) {
    return env.API_ORIGIN;
  } else if (env.DEV) {
    return getLocalOrigin(origin, env.API_LOCAL_ORIGIN);
  } else return env.API_PAGES_ORIGIN;
}

export function getMediaOrigin(env: SiteConfigEnv, origin: string) {
  if (env.ORIGIN === origin) {
    return env.MEDIA_ORIGIN;
  } else if (env.DEV) {
    return getLocalOrigin(origin, env.MEDIA_LOCAL_ORIGIN);
  } else return env.MEDIA_PAGES_ORIGIN;
}
