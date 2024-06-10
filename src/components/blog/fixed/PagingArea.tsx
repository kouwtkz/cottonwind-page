import React, { HTMLAttributes, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AiFillCaretLeft, AiFillCaretRight } from "react-icons/ai";
import { useSearchParams } from "react-router-dom";

interface PagingAreaProps extends HTMLAttributes<HTMLFormElement> {
  max?: number;
}

export default function PagingArea({
  max,
  className,
  ...args
}: PagingAreaProps) {
  className = className ? ` ${className}` : "";
  const _min = 1;
  const _max = max || 1;
  const pagingInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useSearchParams();
  const FormRef = useRef<HTMLFormElement>(null);
  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement === pagingInputRef.current) {
        pagingInputRef.current?.blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags: ["INPUT"] }
  );
  const p = Number(search.get("p")) || 1;
  const pRef = useRef(p);
  useEffect(() => {
    if (pRef.current !== p) {
      if (pagingInputRef.current) {
        const strp = String(p);
        if (pagingInputRef.current.value !== strp)
          pagingInputRef.current.value = strp;
      }
      if (pRef.current !== p) pRef.current = p;
    }
  });
  const submit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (pagingInputRef.current) {
      const p = pagingInputRef.current;
      const newP = Number(p.value);
      const query = Object.fromEntries(search);
      if (newP > 1) query.p = String(newP);
      else delete query.p;
      setSearch(query);
      (document.activeElement as HTMLElement).blur();
      e?.preventDefault();
    }
  };

  return (
    <form
      {...args}
      ref={FormRef}
      className={"paging" + className}
      onSubmit={submit}
    >
      <button
        type="button"
        title="前のページ"
        className="round prev"
        disabled={_min >= p}
        onClick={() => {
          if (pagingInputRef.current) {
            if (_min < p) {
              pagingInputRef.current.value = String(p - 1);
              submit();
            }
          }
        }}
      >
        <AiFillCaretLeft className="svg" />
      </button>
      <input
        title="ブログページ"
        name="p"
        type="number"
        min={1}
        max={_max}
        defaultValue={p}
        ref={pagingInputRef}
      />
      <button
        type="button"
        title="次のページ"
        className="round next"
        disabled={_max <= p}
        onClick={() => {
          if (pagingInputRef.current) {
            if (p < _max) {
              pagingInputRef.current.value = String(p + 1);
              submit();
            }
          }
        }}
      >
        <AiFillCaretRight className="svg" />
      </button>
    </form>
  );
}
