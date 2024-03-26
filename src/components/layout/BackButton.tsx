import { HTMLAttributes, Suspense, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { create } from "zustand";
import { BiLeftArrow } from "react-icons/bi";
import { UrlObject } from "url";
import { KeyValueStringType } from "../../types/ValueType";

type BackButtonType = {
  backUrl: string | UrlObject;
  setBackUrl: (url: string | UrlObject) => void;
};
export const useBackButton = create<BackButtonType>((set) => ({
  backUrl: "",
  setBackUrl(url) {
    set(() => {
      return { backUrl: url };
    });
  },
}));

export function queryCheck({
  query = {},
  separator,
}: {
  query?: KeyValueStringType;
  separator?: string;
}) {
  const queryValues = Object.values(query);
  const queryJoin = queryValues.join(separator);
  const queryEnable = queryValues.some((v) => v);
  return { queryValues, queryJoin, queryEnable };
}

function BackButtonInner() {
  const { pathname, search } = useLocation();
  const { backUrl: backUrl_bc, setBackUrl: setBackUrl_bc } = useBackButton();
  const entriesSearch = Array.from(new URLSearchParams(search).entries());
  const joinSearch = entriesSearch.map(([k, v]) => `${k}=${v}`).join("&");
  const existsSearch = entriesSearch.length > 0;
  useEffect(
    () => () => {
      if (pathname || joinSearch) setBackUrl_bc("");
    },
    [pathname, joinSearch, setBackUrl_bc]
  );
  const backUrl = useMemo(() => {
    if (backUrl_bc)
      return typeof backUrl_bc === "string" ? backUrl_bc : backUrl_bc.href;
    else return existsSearch ? pathname : pathname.replace(/\/[^/]+\/?$/, "");
  }, [backUrl_bc, existsSearch, pathname]);
  return (
    <>
      {pathname !== "/" ? (
        <div>
          <Link to={String(backUrl)}>
            <BiLeftArrow />
          </Link>
        </div>
      ) : null}
    </>
  );
}

export default function BackButton(args: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...args}>
      <Suspense>
        <BackButtonInner />
      </Suspense>
    </div>
  );
}
