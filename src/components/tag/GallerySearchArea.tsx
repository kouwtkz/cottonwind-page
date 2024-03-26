import { HTMLAttributes, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { MakeRelativeURL } from "../doc/MakeURL";

interface SearchAreaProps extends HTMLAttributes<HTMLFormElement> {}

export default function GallerySearchArea({
  className,
  ...args
}: SearchAreaProps) {
  className = className ? ` ${className}` : "";
  const nav = useNavigate();
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
    { enableOnFormTags: ["INPUT"] }
  );
  const search = new URLSearchParams(useLocation().search);
  const q = search.get("q") || "";
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
      className={className}
      onSubmit={(e) => {
        if (searchRef.current) {
          const q = searchRef.current.value;
          const query = Object.fromEntries(search);
          if (q) query.q = q;
          else delete query.q;
          delete query.p;
          delete query.postId;
          nav(MakeRelativeURL({ query }), { preventScrollReset: false });
          (document.activeElement as HTMLElement).blur();
          e.preventDefault();
        }
      }}
    >
      <input
        name="q"
        type="search"
        placeholder="ギャラリー検索"
        defaultValue={q}
        ref={searchRef}
        className="gallerySearch"
      />
    </form>
  );
}
