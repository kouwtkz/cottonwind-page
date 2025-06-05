export function getCookieObject(cookieStr: string) {
  return Object.fromEntries(
    cookieStr.split(/;\s?/)
      .map((v) => {
        const i = v.indexOf("=");
        return [v.slice(0, i), v.slice(i + 1)]
      })
  )
}

interface getCookieObjectProps {
  headers: Headers;
}
type cookieObjectType = { [k: string]: string };
export function getCookieObjectFromHeaders({ headers }: getCookieObjectProps): { [k: string]: string } {
  const cookieStr = headers.get("cookie");
  if (cookieStr) {
    return getCookieObject(cookieStr);
  } else {
    return {};
  }
}

export interface getCookiePropsEither {
  request?: Request;
  headers?: Headers;
  cookie?: cookieObjectType;
};
interface getCookieProps extends getCookiePropsEither {
  key: string
}

export function getCookie({ key, cookie, request, headers }: getCookieProps) {
  if (!cookie) {
    if (headers) cookie = getCookieObjectFromHeaders({ headers });
    else if (request) cookie = getCookieObjectFromHeaders({ headers: request.headers });
  }
  if (cookie) return cookie[key];
}
