import MultiParser from "@/functions/doc/MultiParser";
import { Link, useNavigate } from "react-router-dom";
import { BlogDateOptions as opt } from "@/functions/doc/DateTimeFormatOptions";
import { HTMLAttributes, useCallback, useMemo } from "react";
import { ToHref } from "@/functions/doc/MakeURL";
import { useLocalDraftPost } from "./post/postLocalDraft";
import { useHotkeys } from "react-hotkeys-hook";
import { useManageState } from "@/state/StateSet";
type Props = { post?: Post; detail?: boolean };

export default function OnePost({ post, detail = false }: Props) {
  const isLogin = import.meta.env.DEV || useManageState().isLogin;
  const { removeLocalDraft } = useLocalDraftPost();
  const nav = useNavigate();
  useHotkeys("b", () => {
    if (detail) nav(-1);
  });

  const EditLink = useCallback(
    ({ children = "編集", className }: HTMLAttributes<HTMLElement>) => {
      if (!isLogin) return <></>;
      const query: { [k: string]: string } = {};
      if (post?.postId) query.target = post.postId;
      if (post?.localDraft) query.draft = "";
      return (
        <Link
          className={className ? String(className) : undefined}
          to={ToHref({ pathname: "/blog/post", query })}
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
          <MultiParser className="title">
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
          </MultiParser>
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
      <MultiParser className="blog" hashtag={true}  detailsOpen={detail}>
        {post.body}
      </MultiParser>
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
