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
  if (env.API_ORIGIN === origin) return env.ORIGIN;
  else return origin;
}

export function getAPIOrigin(env: SiteConfigEnv, origin: string, localFullPath = false) {
  let result: string | undefined;
  if ((env.API_ORIGIN && !env.API_ORIGIN.match("://"))) {
    result = new URL(env.API_ORIGIN, origin).href;
  } else if (env.ORIGIN === origin) {
    result = env.API_ORIGIN;
  } else {
    result = getLocalOrigin(origin, env.API_CF_ORIGIN);
  }
  if (localFullPath && result?.startsWith("/")) result = origin + result;
  return result;
}

export function getMediaOrigin(env: SiteConfigEnv, origin: string, localFullPath = false) {
  let result: string | undefined;
  if (env.ORIGIN === origin) {
    result = env.MEDIA_ORIGIN;
  } else {
    result = getLocalOrigin(origin, env.MEDIA_CF_ORIGIN);
  }
  if (localFullPath && result?.startsWith("/")) result = origin + result;
  return result;
}
