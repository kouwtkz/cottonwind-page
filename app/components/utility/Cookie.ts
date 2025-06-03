interface getCookieObjectProps {
  headers: Headers;
}
type cookieObjectType = { [k: string]: string };
export function getCookieObject({ headers }: getCookieObjectProps): { [k: string]: string } {
  const cookieStr = headers.get("cookie");
  if (cookieStr) {
    return Object.fromEntries(
      cookieStr.split(/;\s?/)
        .map((v) => {
          const i = v.indexOf("=");
          return [v.slice(0, i), v.slice(i + 1)]
        })
    )
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
    if (headers) cookie = getCookieObject({ headers });
    else if (request) cookie = getCookieObject({ headers: request.headers });
  }
  if (cookie) return cookie[key];
}
