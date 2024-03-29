import { HTMLAttributes, Suspense, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { create } from "zustand";
import { BiHomeAlt, BiLeftArrow } from "react-icons/bi";
import { UrlObject } from "url";
import { KeyValueStringType } from "../../types/ValueType";
import { useParamsState } from "../../state/ParamsState";

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

export default function BackButton(args: HTMLAttributes<HTMLDivElement>) {
  const { pathname, search } = useParamsState();
  const { backUrl: backUrl_bc, setBackUrl: setBackUrl_bc } = useBackButton();
  const entriesSearch = Array.from(search.entries());
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
    <div {...args}>
      {pathname !== "/" ? (
        <>
          <Link to={String(backUrl)} title="ひとつ前に戻る">
            <BiLeftArrow />
          </Link>
          <Link to="/" title="ホームへ戻る">
          <BiHomeAlt />
          </Link>
        </>
      ) : null}
    </div>
  );
}
