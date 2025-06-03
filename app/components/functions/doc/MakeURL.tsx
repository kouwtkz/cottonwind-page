import { useCallback, useMemo } from "react";
import {
  type LinkProps,
  type Location,
  type To,
  useLocation,
  useNavigate,
} from "react-router";
import type { UrlObject } from "url";
type TypeUrl = string | UrlObject;

export function RelativeURL(url: URL) {
  return url.pathname + url.search;
}

export function MakeURL(href: TypeUrl) {
  let {
    href: _href,
    query,
    search: _search,
    protocol,
    hostname,
    port,
    host,
    pathname,
    hash,
  } = typeof href === "string"
      ? ((href.startsWith("?") ? { query: href } : { href }) as UrlObject)
      : href;
  if (
    _href &&
    !(
      query ||
      _search ||
      protocol ||
      hostname ||
      port ||
      host ||
      pathname ||
      hash
    )
  ) {
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
      const search = new URLSearchParams(
        typeof query === "string"
          ? query
          : Object.fromEntries(
            Object.entries(query).map(([k, v]) => [
              k,
              String(v !== undefined && v !== null ? v : ""),
            ])
          )
      );
      Url.search = search.size
        ? "?" +
        Object.entries(Object.fromEntries(search))
          .map(([a, b]) => (b ? `${a}=${b}` : a))
          .join("&")
        : "";
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
      : MakeURL(src);
}

export function ToHref(src: string | UrlObject | URL) {
  return ToURL(src).href;
}

export function GetUrlFlag(Url: URL) {
  const host = location.origin === Url.origin;
  const pathname = host && location.pathname === Url.pathname;
  return { host, pathname };
}

type LinkMeeUrl = To | URL | UrlObject;
export type LinkMeeUrlFromLocation = (k: Location<any>) => LinkMeeUrl;
interface LinkMeeProps extends Omit<LinkProps, "to" | "state"> {
  to?: LinkMeeUrl | LinkMeeUrlFromLocation;
  state?: Object | LinkMeeUrlFromLocation;
}

export function LinkMee({
  to: __to = "",
  state: _state,
  replace,
  relative,
  preventScrollReset,
  onClick,
  ...props
}: LinkMeeProps) {
  const nav = useNavigate();
  const lc = useLocation();
  const _to = useMemo(() => {
    return typeof __to === "function" ? __to(lc) : __to;
  }, [__to, lc]);
  const to = useMemo(() => {
    let to: To = "";
    if (typeof _to === "object") {
      if ("searchParams" in _to) {
        to = RelativeURL(_to);
      } else to = MakeRelativeURL(_to);
    } else to = _to;
    return to;
  }, [_to]);
  return (
    <a
      onClick={useCallback(
        (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
          if (onClick) onClick(e);
          const state = typeof _state === "function" ? _state(lc) : _state;
          nav(to, { state, replace, relative, preventScrollReset });
          e.preventDefault();
        },
        [to, lc]
      )}
      href={to}
      {...props}
    />
  );
}

export interface SearchTypes {
  search: string;
  searchParams: URLSearchParams;
  query: KeyValueStringType;
}

export function SearchSet(search: string) {
  const searchParams = new URLSearchParams(location.search);
  const query = Object.fromEntries(searchParams) as KeyValueStringType;
  return { search, searchParams, query };
}

export type LocationStateType = KeyValueAnyType | null;
