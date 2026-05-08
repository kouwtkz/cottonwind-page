import { usePosts } from "~/components/state/PostState";
import { Link, useNavigate, useSearchParams } from "react-router";
import { findMee, setWhere } from "~/data/find/findMee";
import { useLocalDraftPost } from "./edit/PostForm";
import {
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TbRss } from "react-icons/tb";
import type { UrlObject } from "url";
import { ToHref } from "~/components/functions/doc/MakeURL";
import { useHotkeys } from "react-hotkeys-hook";
import { SiteDateOptions as opt } from "~/components/functions/DateFunction";
import { MultiParserWithMedia } from "~/components/parse/MultiParserWithMedia";
import { useEnv, useIsLogin } from "~/components/state/EnvState";
import { TfiWrite } from "react-icons/tfi";
import { AiFillCaretLeft, AiFillCaretRight, AiFillEdit } from "react-icons/ai";
import { PiHandsClapping } from "react-icons/pi";
import { RbButtonArea } from "~/components/dropdown/RbButtonArea";
import { MdOutlineImage, MdRssFeed, MdUpdate } from "react-icons/md";
import { getBackURL } from "~/components/layout/BackButton";
import { useExtRss } from "~/components/state/ExtRssState";
import { apiOrigin, ExtRssData } from "~/data/ClientDBLoader";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { customFetch } from "~/components/functions/fetch";
import { toast } from "react-toastify";

interface getPostsProps {
  posts: PostPagesItemType[];
  update?: boolean;
  take?: number;
  page?: number;
  q?: string;
  common?: boolean;
  pinned?: boolean;
}
export function getPosts({
  posts,
  take,
  page,
  common,
  q = "",
  pinned = false,
}: getPostsProps) {
  if (page) page--;
  const skip = take && page ? take * page : 0;
  const options: WhereOptionsKvType<PostType> = {
    text: { key: "body" },
    hashtag: { textKey: "body", key: "category" },
  };
  const wheres = [setWhere(q, options).where];
  if (common) wheres.push({ draft: false, time: { lte: new Date() } });
  const orderBy: any[] = [];
  if (pinned) orderBy.push({ pin: "desc" });
  orderBy.push({ time: "desc" });

  let postsResult = findMee(posts, {
    where: {
      AND: wheres,
    },
    orderBy,
  });
  try {
    const count = postsResult.length;
    postsResult = postsResult.filter((post, i) => {
      if (take !== undefined && i >= take + skip) return false;
      return ++i > skip;
    });
    const max = Math.ceil(count / (take || count));
    return { posts: postsResult, count, max };
  } catch (e) {
    console.log(e);
    return { posts: [], count: 0, max: 0 };
  }
}

export function BlogPage({
  blogEnable,
}: {
  title?: string;
  blogEnable?: boolean;
}) {
  const [searchParams] = useSearchParams();
  const p = searchParams.get("p") || undefined;
  const q = searchParams.get("q") || undefined;
  const postId = searchParams.get("postId") || undefined;
  const postpageQuery = { p, q, postId };
  const blogTopLink: UrlObject = { pathname: "/blog" };
  return (
    <>
      <div className="blogPage">
        <div className="header">
          <Link
            to={blogTopLink.href ?? ""}
            className="title"
            title="ブログトップ"
          >
            <h2 className="en-title-font">MINI BLOG</h2>
          </Link>
          <Link
            title="RSSフィード"
            className="feed"
            target="_blank"
            to="/blog/rss.xml"
          >
            <TbRss />
          </Link>
        </div>
        <PostsPage {...postpageQuery} />
      </div>
    </>
  );
}

export function PostsPage({
  p = "1",
  q,
  postId,
}: {
  p?: string;
  q?: string;
  postId?: string;
}) {
  const page = Number(p);
  const take = postId ? undefined : 10;
  const { localDraft, getLocalDraft } = useLocalDraftPost();
  const isLogin = useIsLogin()[0];
  useEffect(() => {
    if (!isLogin) return;
    getLocalDraft();
  }, [isLogin, getLocalDraft]);

  const { posts: sitePosts } = usePosts();
  const extRss = useExtRss();
  let posts = useMemo(() => {
    const list: PostPagesItemType[] = sitePosts ? sitePosts.concat() : [];
    if (extRss) {
      extRss.forEach((channel) => {
        const topLink = channel.link;
        const topLinkURL = new URL(topLink);
        const host = topLinkURL.host;
        channel.items.forEach((item) => {
          list.push({
            servise: host,
            extension: "ExtRSS",
            title: item.title,
            body: item.description,
            time: new Date(item.pubDate),
            link: item.link,
            postId: item.guid,
            draft: false,
          });
        });
      });
    }
    return list;
  }, [sitePosts, extRss]);
  posts = useMemo(() => {
    if (posts.length > 0) {
      const where = setWhere<PostPagesItemType>(q, {
        text: { key: "body" },
        hashtag: { key: "category", textKey: "body" },
      });
      return findMee(posts, where);
    } else return posts;
  }, [posts, q]);
  const {
    posts: postsResult,
    max,
    count,
  } = useMemo(() => {
    const result = getPosts({
      posts,
      page,
      take,
      common: !isLogin,
    });
    result.posts.sort((a, b) => (b.pin || 0) - (a.pin || 0));
    return result;
  }, [page, posts, q, take]);

  if (postId) {
    const post = findMee(posts, { where: { postId }, take: 1 })[0] as
      | PostPagesItemType
      | undefined;
    return (
      <div className="article detail">
        <PostDetailFixed
          postId={postId}
          posts={postsResult}
          extRss={post?.extension === "ExtRSS"}
        />
        {post ? <OnePost post={post} detail={true} /> : null}
      </div>
    );
  } else {
    return (
      <>
        <PostsPageFixed max={max} />
        <div className="article">
          {localDraft ? (
            <OnePost post={{ ...localDraft, pin: 0xffff }} />
          ) : null}
          {postsResult.length > 0 ? (
            <>
              {postsResult.map((post, index) => (
                <OnePost post={post} key={index} />
              ))}
              {max > 1 && (page || 1) < max ? (
                <div className="message">
                  <Link
                    className="next"
                    to={ToHref({
                      pathname: "/blog",
                      query: {
                        ...(q ? { q } : {}),
                        p: (page || 1) + 1,
                      },
                    })}
                  >
                    次のページ ▽
                  </Link>
                </div>
              ) : null}
            </>
          ) : posts ? (
            <div className="message">投稿はありません</div>
          ) : (
            <div className="message">よみこみちゅう…</div>
          )}
        </div>
      </>
    );
  }
}

type OnePostProps = { post: PostPagesItemType; detail?: boolean };
export default function OnePost({ post, detail = false }: OnePostProps) {
  const isLogin = useIsLogin()[0];
  const { removeLocalDraft } = useLocalDraftPost();
  const nav = useNavigate();
  useHotkeys("b", () => {
    if (detail) nav(-1);
  });

  const EditLink = useCallback(
    ({ children = "編集", className }: HTMLAttributes<HTMLElement>) => {
      if (!isLogin) return <></>;
      const state: { [k: string]: any } = {};
      const url = new URL("/blog/post", location.href);
      if (post?.postId) url.searchParams.append("target", post.postId);
      if (post?.localDraft) url.searchParams.append("draft", "local");
      state.backUrl = getBackURL();
      return (
        <Link
          className={className ? String(className) : undefined}
          to={url.href}
          state={state}
        >
          <>{children}</>
        </Link>
      );
    },
    [isLogin, post],
  );
  const formattedDate = useMemo(
    () => (post?.time ? post.time.toLocaleString("ja-JP", opt) : ""),
    [post],
  );
  if (!post) return null;
  const markdownFlag = useMemo(() => post.extension !== "ExtRSS", [post]);
  const markdownProps = useMemo(
    () => (markdownFlag ? { markdown: true, hashtag: true } : {}),
    [markdownFlag],
  );

  return (
    <div className="post">
      {post.localDraft ? (
        <div>
          <EditLink>▼ 自動保存された下書き</EditLink>
        </div>
      ) : !detail && typeof post.pin === "number" ? (
        post.pin > 0 ? (
          <div className="pinned">▼ 固定された投稿</div>
        ) : null
      ) : null}
      <div className="header">
        {post.title ? (
          <MultiParserWithMedia {...markdownProps} linkPush className={"title"}>
            {detail ? (
              <h1>{post.title}</h1>
            ) : (
              <h3>
                {post.localDraft ? (
                  post.title
                ) : (
                  <Link
                    to={ToHref({
                      pathname: "/blog",
                      query: { postId: post.postId },
                    })}
                  >
                    {post.title}
                  </Link>
                )}
              </h3>
            )}
          </MultiParserWithMedia>
        ) : (
          <></>
        )}
        {post.category ? (
          <div className="category">
            {(typeof post.category === "string"
              ? [post.category]
              : post.category
            ).map((category, i) => (
              <div key={`post_category_${category}`}>
                <Link
                  to={ToHref({
                    pathname: "/blog",
                    query: { q: `#${category}` },
                  })}
                >
                  {category}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <></>
        )}
      </div>
      <MultiParserWithMedia
        {...markdownProps}
        linkPush
        className="blog"
        detailsOpen={detail}
      >
        {post.body}
      </MultiParserWithMedia>
      <div className="footer">
        {typeof post.time !== "undefined" ? (
          post.draft ? (
            <span className="status">(下書き)</span>
          ) : post.time && post.time.getTime() > Date.now() ? (
            <span className="status">(予約)</span>
          ) : null
        ) : null}
        {post.localDraft ? (
          <a
            href="#delete"
            onClick={(e) => {
              if (confirm("自動保存された下書きを削除しますか？")) {
                removeLocalDraft();
              }
              e.preventDefault();
            }}
          >
            削除
          </a>
        ) : null}
        {!post.servise ? (
          <EditLink />
        ) : (
          <Link
            className="extension"
            to={{ search: "?q=servise%3A" + post.servise }}
          >
            {post.servise}
          </Link>
        )}
        <>
          {post.localDraft ? (
            <>
              <span className="status">
                {post.postId ? (
                  <>下書き（{post.postId}）</>
                ) : (
                  <>下書き（新規投稿）</>
                )}
              </span>
            </>
          ) : post.link ? (
            <a className="status" target="_blank" href={post.link}>
              {formattedDate}
            </a>
          ) : detail ? (
            <>
              <span className="status">{formattedDate}</span>
            </>
          ) : (
            <Link
              className="status"
              to={ToHref({
                pathname: "/blog",
                query: { postId: post.postId },
              })}
            >
              {formattedDate}
            </Link>
          )}
        </>
      </div>
    </div>
  );
}

const ImageManageButtonSearch = new URLSearchParams({
  q: "album:blog",
}).toString();
function ImageManageButton() {
  return (
    <Link
      className="button color round"
      title="ブログの画像の編集"
      to={{ pathname: "/admin/images", search: ImageManageButtonSearch }}
      state={{ backUrl: getBackURL() }}
    >
      <MdOutlineImage />
    </Link>
  );
}
function UpdateExtRss() {
  return (
    <button
      className="button color round"
      title="外部RSSの手動更新"
      type="button"
      onClick={async () => {
        const url = concatOriginUrl(apiOrigin, "extRss/update");
        customFetch(url, { method: "POST", cors: true })
          .then<[string, ExtRssType[]]>((r) => {
            if (r.ok) return r.json();
            else throw r.statusText;
          })
          .then((json) => {
            ExtRssData.SetData.bind(ExtRssData)(json[1]);
            toast.success("外部RSSを更新しました！");
          })
          .catch((e) => {
            console.error(e);
            toast.error("エラーが発生しました\n" + e);
          });
      }}
    >
      <MdUpdate />
    </button>
  );
}

type FixedProps = { max?: number };
export function PostsPageFixed({ max }: FixedProps) {
  const isLogin = useIsLogin()[0];
  return (
    <RbButtonArea
      className="blog"
      dropdown={
        <>
          {isLogin ? (
            <>
              <ImageManageButton />
              <UpdateExtRss />
            </>
          ) : null}
          {isLogin ? <PostButton /> : <HandsClapButton />}
        </>
      }
    >
      <PagingArea className="list" max={max} />
      <SearchArea />
    </RbButtonArea>
  );
}

type PostDetailFixedProps = {
  postId: string;
  extRss?: boolean;
  posts: PostPagesItemType[];
};
export function PostDetailFixed({ extRss, ...args }: PostDetailFixedProps) {
  const isLogin = useIsLogin()[0];
  return (
    <RbButtonArea
      className="blog"
      dropdown={
        <>
          <HandsClapButton />
          {isLogin ? (
            <>
              <ImageManageButton />
              {isLogin ? (
                extRss ? (
                  <UpdateExtRss />
                ) : (
                  <PostButton postId={args.postId} />
                )
              ) : null}
            </>
          ) : null}
        </>
      }
    >
      <BackForwardPost className="list" {...args} />
      <SearchArea />
    </RbButtonArea>
  );
}

interface BackForwardPostProps extends HTMLAttributes<HTMLDivElement> {
  postId: string;
  posts: PostPagesItemType[];
}

export function BackForwardPost({
  postId,
  posts,
  className,
  ...args
}: BackForwardPostProps) {
  className = useMemo(() => {
    const classes = ["paging"];
    if (className) classes.push(className);
    return classes.join(" ");
  }, [className]);
  const nav = useNavigate();
  const postIndex = posts.findIndex((post) => post.postId === postId);
  const beforePost = posts[postIndex - 1];
  const afterPost = posts[postIndex + 1];

  // const _min = 1;
  // const _max = max || 1;
  // const before;

  return (
    <div {...args} className={className}>
      <button
        type="button"
        className="color round"
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
        className="color round"
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
    <button
      {...args}
      className={"round color" + className}
      onClick={() => nav(link)}
    >
      {postId ? <TfiWrite className="svg" /> : <AiFillEdit className="svg" />}
    </button>
  );
}

interface PagingAreaProps extends HTMLAttributes<HTMLFormElement> {
  max?: number;
}

export function PagingArea({ max, className, ...args }: PagingAreaProps) {
  className = useMemo(() => {
    const classes = ["paging"];
    if (className) classes.push(className);
    return classes.join(" ");
  }, [className]);
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
    { enableOnFormTags: ["INPUT"] },
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
    <form {...args} ref={FormRef} className={className} onSubmit={submit}>
      <button
        type="button"
        title="前のページ"
        className="color round prev"
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
        className="color round next"
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
  className = useMemo(() => {
    const classes = ["button round color"];
    if (className) classes.push(className);
    return classes.join(" ");
  }, [className]);
  className = className ? ` ${className}` : "";
  const [env] = useEnv();
  return env?.WAVEBOX ? (
    <Link
      {...args}
      to={env.WAVEBOX}
      title="拍手ボタン"
      className={className}
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
