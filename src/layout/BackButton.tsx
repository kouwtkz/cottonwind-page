import { HTMLAttributes, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { RiPlayReverseLargeLine } from "react-icons/ri";

export default function BackButton(args: HTMLAttributes<HTMLAnchorElement>) {
  const { pathname, state } = useLocation();
  const [searchParams] = useSearchParams();
  const backUrl: string = useMemo(() => {
    if (state?.backUrl) {
      return state.backUrl;
    } else {
      return searchParams.size > 0
        ? pathname
        : pathname.replace(/\/[^/]+\/?$/, "");
    }
  }, [state, searchParams, pathname]);

  return (
    <Link
      {...args}
      to={String(backUrl)}
      title="ひとつ前に戻る"
      style={{ visibility: pathname !== "/" ? "visible" : "hidden" }}
    >
      <RiPlayReverseLargeLine />
    </Link>
  );
}
