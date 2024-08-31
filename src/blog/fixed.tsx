import React, { Suspense, HTMLAttributes, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AiFillCaretLeft, AiFillCaretRight } from "react-icons/ai";
import { Link, useSearchParams } from "react-router-dom";
import { AiFillEdit } from "react-icons/ai";
import { TfiWrite } from "react-icons/tfi";
import { useNavigate } from "react-router-dom";
import { PiHandsClapping } from "react-icons/pi";
import { useAtom } from "jotai";
import { EnvAtom, isLoginAtom } from "@/state/EnvState";

type FixedProps = { max?: number };
export default function Fixed({ max }: FixedProps) {
  const isLogin = useAtom(isLoginAtom)[0];
  return (
    <Suspense>
      <div className="fixed rightBottom">
        <div className="list">
          <PagingArea max={max} />
          <div className="list">
            <SearchArea />
            {isLogin ? <PostButton /> : <HandsClapButton />}
          </div>
        </div>
      </div>
    </Suspense>
  );
}

type PostDetailFixedProps = { postId: string; posts: Post[] };
export function PostDetailFixed(args: PostDetailFixedProps) {
  const isLogin = useAtom(isLoginAtom)[0];
  return (
    <Suspense>
      <div className="fixed rightBottom">
        <div className="list">
          <div className="list">
            <BackForwardPost {...args} />
            <SearchArea />
            {isLogin ? (
              <PostButton postId={args.postId} />
            ) : (
              <HandsClapButton />
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
}

interface BackForwardPostProps extends HTMLAttributes<HTMLDivElement> {
  postId: string;
  posts: Post[];
}

export function BackForwardPost({
  postId,
  posts,
  className,
  ...args
}: BackForwardPostProps) {
  const nav = useNavigate();
  className = className ? ` ${className}` : "";
  const postIndex = posts.findIndex((post) => post.postId === postId);
  const beforePost = posts[postIndex - 1];
  const afterPost = posts[postIndex + 1];

  // const _min = 1;
  // const _max = max || 1;
  // const before;

  return (
    <div {...args} className={"paging" + className}>
      <button
        type="button"
        className="round"
        disabled={!beforePost}
        title={beforePost?.title || ""}
        onClick={() => {
          nav(`?postId=${beforePost.postId}`);
        }}
      >
        <AiFillCaretLeft className="svg" />
      </button>
      <button
        type="button"
        className="round"
        disabled={!afterPost}
        title={afterPost?.title || ""}
        onClick={() => {
          nav(`?postId=${afterPost.postId}`);
        }}
      >
        <AiFillCaretRight className="svg" />
      </button>
    </div>
  );
}

interface PostButtonProps extends HTMLAttributes<HTMLButtonElement> {
  postId?: string;
}

export function PostButton({ postId, className, ...args }: PostButtonProps) {
  className = className ? ` ${className}` : "";
  const nav = useNavigate();
  const link = `/blog/post${postId ? `?target=${postId}` : ""}`;
  useHotkeys("n", () => nav(link));
  return (
    <button {...args} className={"round" + className} onClick={() => nav(link)}>
      {postId ? <TfiWrite className="svg" /> : <AiFillEdit className="svg" />}
    </button>
  );
}

interface PagingAreaProps extends HTMLAttributes<HTMLFormElement> {
  max?: number;
}

export function PagingArea({ max, className, ...args }: PagingAreaProps) {
  className = className ? ` ${className}` : "";
  const _min = 1;
  const _max = max || 1;
  const pagingInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
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
  const p = Number(searchParams.get("p")) || 1;
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
      const query = Object.fromEntries(searchParams);
      if (newP > 1) query.p = String(newP);
      else delete query.p;
      setSearchParams(query);
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

interface HandsClapButtonProps extends HTMLAttributes<HTMLAnchorElement> {
  postId?: string;
}

export function HandsClapButton({
  postId,
  className,
  ...args
}: HandsClapButtonProps) {
  className = className ? ` ${className}` : "";
  const [env] = useAtom(EnvAtom);
  return env?.WAVEBOX ? (
    <Link
      {...args}
      to={env.WAVEBOX}
      title="拍手ボタン"
      className={"button round" + className}
      target="_blank"
    >
      <PiHandsClapping className="svg" />
    </Link>
  ) : (
    <></>
  );
}

interface SearchAreaProps extends HTMLAttributes<HTMLFormElement> {}

export function SearchArea({ className, ...args }: SearchAreaProps) {
  className = className ? ` ${className}` : "";
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
