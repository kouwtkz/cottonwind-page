import { useEffect, useMemo, useRef, type HTMLAttributes } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useSearchParams } from "react-router";
import { useIsLogin } from "./state/EnvState";
import { RbButtonArea } from "./dropdown/RbButtonArea";
import { DefaultClassNameMemo } from "./functions/className";

interface SearchAreaProps extends HTMLAttributes<HTMLFormElement> {}

export function SearchArea({ className, ...args }: SearchAreaProps) {
  className = DefaultClassNameMemo(className);
  const searchRef = useRef<HTMLInputElement>(null);
  useHotkeys("slash", (e) => {
    searchRef.current?.focus();
    e.preventDefault();
  });
  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement === searchRef.current) {
        searchRef.current?.blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags: ["INPUT"] },
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const qRef = useRef(q);
  useEffect(() => {
    if (qRef.current !== q) {
      if (searchRef.current) {
        const strq = String(q);
        if (searchRef.current.value !== strq) searchRef.current.value = strq;
      }
      if (qRef.current !== q) qRef.current = q;
    }
  });

  return (
    <form
      className={"search" + className}
      onSubmit={(e) => {
        if (searchRef.current) {
          const q = searchRef.current.value;
          const query = Object.fromEntries(searchParams);
          if (q) query.q = q;
          else delete query.q;
          delete query.p;
          delete query.postId;
          setSearchParams(query);
          (document.activeElement as HTMLElement).blur();
          e.preventDefault();
        }
      }}
    >
      <input
        id="post_search"
        name="q"
        type="search"
        placeholder="検索"
        defaultValue={q}
        ref={searchRef}
      />
    </form>
  );
}

type FixedProps = { className?: string };
export function RbFixedArea({ className }: FixedProps = {}) {
  className = DefaultClassNameMemo(className);
  return (
    <RbButtonArea
      className={className}
    >
      <SearchArea />
    </RbButtonArea>
  );
}
