import type { UrlObject } from 'url';
type TypeUrl = string | UrlObject;

export function RelativeURL(url: URL) {
  return url.pathname + url.search
}

export function MakeURL(href: TypeUrl) {
  let { href: _href, query, search: _search, protocol, hostname, port, host, pathname, hash } =
    typeof href === "string" ?
      (href.startsWith("?") ? { query: href } : { href }) as UrlObject : href;
  if (_href && !(query || _search || protocol || hostname || port || host || pathname || hash)) {
    const Url = new URL(_href, location.href);
    return Url;
  } else {
    const Url = new URL(location.href);
    if (protocol) Url.protocol = protocol;
    if (hostname) Url.hostname = hostname;
    if (port) Url.port = String(port);
    if (host) Url.host = host;
    if (pathname) Url.pathname = pathname;
    if (hash) Url.hash = hash;
    query = query || _search;
    if (query) {
      const search = new URLSearchParams(typeof query === "string" ? query :
        Object.fromEntries(Object.entries(query)
          .map(([k, v]) => [k, String((v !== undefined && v !== null) ? v : "")])));
      Url.search = search.size ? ("?" + Object.entries(Object.fromEntries(search))
        .map(([a, b]) => b ? `${a}=${b}` : a).join("&")) : "";
    }
    return Url;
  }
}

export function MakeRelativeURL(href: TypeUrl) {
  return RelativeURL(MakeURL(href));
}

export function ToURL(src: string | UrlObject | URL) {
  return typeof src === "string"
    ? new URL(src, location.href)
    : "searchParams" in src
      ? src
      : MakeURL(src)
}

export function GetUrlFlag(Url: URL) {
  const host = location.origin === Url.origin;
  const pathname = host && location.pathname === Url.pathname;
  return { host, pathname };
}