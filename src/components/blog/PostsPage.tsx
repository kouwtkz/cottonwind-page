import OnePost from "./OnePost";
import PostState, { usePostState } from "./PostState";
import { Link, useSearchParams } from "react-router-dom";
import { findMany } from "./functions/findMany.mjs";
import getPosts from "./functions/getPosts.mjs";
import PostsPageFixed from "./fixed/PostsPageFixed";
import PostDetailFixed from "./fixed/PostDetailFixed";
import { getLocalDraft, useLocalDraftPost } from "./post/postLocalDraft";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { TbRss } from "react-icons/tb";
import type { UrlObject } from "url";
import { ToHref } from "@/components/doc/MakeURL";
import { useBackButton, queryCheck } from "@/components/layout/BackButton";
import { MdClientNode } from "@/components/md/MarkdownDataClient";
import { useManageState } from "@/state/StateSet";

export function BlogPage({
  blogEnable,
}: {
  title?: string;
  blogEnable?: boolean;
}) {
  const [search] = useSearchParams();
  const p = search.get("p") || undefined;
  const q = search.get("q") || undefined;
  const postId = search.get("postId") || undefined;
  const postpageQuery = { p, q, postId };
  const { queryEnable, queryJoin } = queryCheck({
    query: postpageQuery,
  });
  const arc = "archive";
  const arcEnable1 = !blogEnable && queryEnable;
  // useEffect(() => {
  //   if (arcEnable1 && queryJoin) setBackUrl({ query: { show: arc } });
  // }, [arcEnable1, queryJoin, setBackUrl]);
  const blogTopLink: UrlObject = { pathname: "/blog" };
  if (arcEnable1 && queryJoin) {
    blogTopLink.query = { show: arc };
  }
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
  const page = Number(p);
  const { posts } = usePostState();
  const take = postId ? undefined : 10;
  const { localDraft, setLocalDraft } = useLocalDraftPost();
  const isLogin = import.meta.env.DEV || useManageState().isLogin;
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
      common: import.meta.env.PROD,
    });
    result.posts.sort((a, b) => (b.pin || 0) - (a.pin || 0));
    return result;
  }, [page, posts, q, take]);

  if (postId) {
    return (
      <div className="article detail">
        <PostDetailFixed postId={postId} posts={postsResult} />
        <OnePost
          post={findMany({ list: posts, where: { postId }, take: 1 })[0]}
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
