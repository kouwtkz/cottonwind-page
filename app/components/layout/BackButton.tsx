import { type HTMLAttributes, useMemo } from "react";
import { Link, useLocation, type Location } from "react-router";
import { RiPlayReverseLargeLine } from "react-icons/ri";

export function getBackURL(href?: string | null) {
  if (globalThis.location) {
    const Url = new URL(href || location.href, location.href);
    return Url.pathname + Url.search + Url.hash;
  }
}
export function getBackButtonURL({
  pathname,
  search,
  state,
}: Partial<Location<any>>) {
  if (state?.backUrl) {
    return state.backUrl;
  } else {
    return search ? pathname : pathname?.replace(/\/[^/]+\/?$/, "");
  }
}

export default function BackButton(args: HTMLAttributes<HTMLAnchorElement>) {
  const l = useLocation();
  const backUrl = useMemo(() => String(getBackButtonURL(l)), [l]);
  return (
    <Link
      {...args}
      to={backUrl}
      title="ひとつ前に戻る"
      style={{ visibility: l.pathname !== "/" ? "visible" : "hidden" }}
    >
      <RiPlayReverseLargeLine />
    </Link>
  );
}
