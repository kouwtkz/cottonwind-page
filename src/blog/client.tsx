import PostState, { usePostState } from "@/blog/PostState";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { findMee } from "@/functions/findMee";
import getPosts from "./getPosts";
import PostsPageFixed, { PostDetailFixed } from "@/blog/fixed";
import { getLocalDraft, useLocalDraftPost } from "./PostForm";
import { HTMLAttributes, useCallback, useEffect, useMemo } from "react";
import { TbRss } from "react-icons/tb";
import type { UrlObject } from "url";
import { ToHref } from "@/functions/doc/MakeURL";
import { pageIsCompleteAtom } from "@/state/StateSet";
import { useHotkeys } from "react-hotkeys-hook";
import { BlogDateOptions as opt } from "@/functions/doc/DateTimeFormatOptions";
import { MultiParserWithMedia } from "@/components/parse/MultiParserWithMedia";
import { useAtom } from "jotai";
import { isLoginAtom } from "@/state/EnvState";

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
      <PostState />
      <div className="blogPage">
        <div className="header">
          <Link
            to={blogTopLink.href ?? ""}
            className="title"
            title="ブログトップ"
          >
            <h2>MINI BLOG</h2>
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
  const { isSet: postsIsSet } = usePostState();
  const setIsComplete = useAtom(pageIsCompleteAtom)[1];
  useEffect(() => {
    if (postsIsSet) setIsComplete(true);
    else setIsComplete(false);
  }, [postsIsSet]);
  const page = Number(p);
  const { posts } = usePostState();
  const take = postId ? undefined : 10;
  const { localDraft, setLocalDraft } = useLocalDraftPost();
  const isLogin = useAtom(isLoginAtom)[0];
  useEffect(() => {
    if (!isLogin) return;
    const item = getLocalDraft();
    if (item) setLocalDraft(item);
  }, [setLocalDraft]);

  const {
    posts: postsResult,
    max,
    count,
  } = useMemo(() => {
    const result = getPosts({
      posts,
      page,
      q,
      take,
      common: !import.meta.env?.DEV,
    });
    result.posts.sort((a, b) => (b.pin || 0) - (a.pin || 0));
    return result;
  }, [page, posts, q, take]);

  if (postId) {
    return (
      <div className="article detail">
        <PostDetailFixed postId={postId} posts={postsResult} />
        <OnePost
          post={findMee({ list: posts, where: { postId }, take: 1 })[0]}
          detail={true}
        />
      </div>
    );
  } else {
    return (
      <>
        <PostsPageFixed max={max} />
        {/* {page <= 1 ? <h2>このブログはアーカイブしました！</h2> : null} */}
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
          ) : postsIsSet ? (
            <div className="message">投稿はありません</div>
          ) : (
            <div className="message">よみこみちゅう…</div>
          )}
        </div>
      </>
    );
  }
}

type OnePostProps = { post?: Post; detail?: boolean };
export default function OnePost({ post, detail = false }: OnePostProps) {
  const isLogin = useAtom(isLoginAtom)[0];
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
      if (post?.postId) url.searchParams.set("target", post.postId);
      if (post?.localDraft) state.draft = true;
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
    [isLogin, post]
  );
  const formattedDate = useMemo(
    () => (post?.date ? post.date.toLocaleString("ja", opt) : ""),
    [post]
  );
  if (!post) return null;

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
          <MultiParserWithMedia className="title">
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
              <div key={i}>
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
        className="blog"
        hashtag={true}
        detailsOpen={detail}
      >
        {post.body}
      </MultiParserWithMedia>
      <div className="footer">
        {typeof post.date !== "undefined" ? (
          post.draft ? (
            <span className="status">(下書き)</span>
          ) : post.date && post.date.getTime() > Date.now() ? (
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
        <EditLink />
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
