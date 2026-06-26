import { useMixPosts } from "~/components/state/PostState";
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
import { MdOutlineImage, MdUpdate } from "react-icons/md";
import { getBackURL } from "~/components/layout/BackButton";
import { apiOrigin, ExtRssData } from "~/data/ClientDBLoader";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { customFetch } from "~/components/functions/fetch";
import { toast } from "react-toastify";
import { SearchArea } from "~/components/Search";
import { RiArrowGoBackFill } from "react-icons/ri";

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
            <h2 className="en-title-font">MEE BLOG</h2>
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

  const mixPosts = useMixPosts() || [];
  let posts = useMemo(() => {
    if (mixPosts.length > 0) {
      const where = setWhere<PostPagesItemType>(q, {
        text: { key: "body" },
        hashtag: { key: "category", textKey: "body" },
      });
      return findMee(mixPosts, where);
    } else return mixPosts;
  }, [mixPosts, q]);
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

  const post = useMemo(() => {
    if (postId) {
      return (
        findMee(posts, { where: { postId }, take: 1 })[0] || {
          postId,
        }
      );
    } else return null;
  }, [postId, posts]);
  return (
    <>
      {post ? (
        <div className="article detail">
          <PostDetailFixed
            post={post}
            posts={postsResult}
            extRss={post?.extension === "ExtRSS"}
          />
          {post ? <OnePost post={post} detail={true} /> : null}
        </div>
      ) : (
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
      )}
    </>
  );
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
        <div className="category">
          {post.extension ? (
            <Link
              key={"post-extension-" + post.extension}
              to={{ search: `q=extension%3A${post.extension}` }}
            >
              {post.extension === "ExtRSS"
                ? "外部RSS"
                : post.extension === "mochott"
                  ? "mochott"
                  : null}
            </Link>
          ) : null}
          {(post.category
            ? typeof post.category === "string"
              ? [post.category]
              : post.category
            : []
          ).map((category, i) => (
            <Link
              to={ToHref({
                pathname: "/blog",
                query: { q: `#${category}` },
              })}
              key={`post_category_${category}`}
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
      {typeof post.body === "object" ? (
        post.body.$type === "site.mochott.article" ? (
          <MochottArticle base={post.postId || ""} url={post.body.url}>
            {post.body.content.content}
          </MochottArticle>
        ) : null
      ) : (
        <MultiParserWithMedia
          {...markdownProps}
          linkPush
          className="blog"
          detailsOpen={detail}
        >
          {post.body}
        </MultiParserWithMedia>
      )}
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
        {!post.host ? (
          <EditLink />
        ) : (
          <Link className="extension" to={{ search: "?q=host%3A" + post.host }}>
            {post.host}
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
            <span className="status">{formattedDate}</span>
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

interface MochottArticle_Props {
  children: mochott_content_general_union | mochott_content_general_union[];
  base: string;
  url?: URL;
}
interface MctAtc_Props extends Omit<MochottArticle_Props, "url"> {
  isTableDirectry?: boolean;
}
function MochottArticle({ url, ...props }: MochottArticle_Props) {
  const [footnoteObj, setFootnoteObj] = useState<{
    map: Map<string, [number, mochott_content_footnote]>;
  }>({ map: new Map() });
  const MctAtc = useCallback(
    ({ children: argsChild, base, isTableDirectry }: MctAtc_Props) => {
      const children = Array.isArray(argsChild) ? argsChild : [argsChild];
      if (isTableDirectry) {
        if (
          children[0]?.type === "tableRow" &&
          children[0].content[0]?.type === "tableHeader"
        ) {
          const theadOption = {
            key: base + "-0",
            content: children.slice(0, 1),
          };
          const tbodyOption = { key: base + "-1", content: children.slice(1) };
          return [
            <thead key={theadOption.key}>
              <MctAtc base={theadOption.key}>{theadOption.content}</MctAtc>
            </thead>,
            <tbody key={tbodyOption.key}>
              <MctAtc base={tbodyOption.key}>{tbodyOption.content}</MctAtc>
            </tbody>,
          ];
        } else {
          const key = base + "-0";
          return [
            <tbody key={key}>
              <MctAtc base={key}>{children}</MctAtc>
            </tbody>,
          ];
        }
      }
      return children.map((item, i) => {
        const key = `${base}-${i}`;
        const style: React.CSSProperties = {};
        if ("attrs" in item) {
          if ("textAlign" in item.attrs && item.attrs.textAlign) {
            style.textAlign = item.attrs.textAlign;
          }
        }
        switch (item.type) {
          case "paragraph":
            item.attrs.textAlign;
            if (item.content)
              return (
                <p style={style} key={key}>
                  <MctAtc base={key}>{item.content}</MctAtc>
                </p>
              );
            break;
          case "heading":
            if (item.content)
              switch (item.attrs.level) {
                case 2:
                  return (
                    <h2 style={style} key={key}>
                      <MctAtc base={key}>{item.content}</MctAtc>
                    </h2>
                  );
                case 3:
                  return (
                    <h3 style={style} key={key}>
                      <MctAtc base={key}>{item.content}</MctAtc>
                    </h3>
                  );
                case 4:
                  return (
                    <h4 style={style} key={key}>
                      <MctAtc base={key}>{item.content}</MctAtc>
                    </h4>
                  );
              }
            break;
          case "image":
            const srcUrl = new URL(item.attrs.src, url?.href);
            return (
              <figure key={"fig-" + key}>
                <img
                  key={key}
                  alt={item.attrs.alt}
                  src={srcUrl.href}
                  style={style}
                />
                {item.attrs.title ? (
                  <figcaption>{item.attrs.title}</figcaption>
                ) : null}
              </figure>
            );
          case "hardBreak":
            return <br key={key} />;
          case "horizontalRule":
            return <hr key={key} />;
          case "bulletList":
            return (
              <ul key={key}>
                <MctAtc base={key}>{item.content}</MctAtc>
              </ul>
            );
          case "orderedList":
            return (
              <ol key={key}>
                <MctAtc base={key}>{item.content}</MctAtc>
              </ol>
            );
          case "listItem":
            return (
              <li key={key}>
                <MctAtc base={key}>{item.content}</MctAtc>
              </li>
            );
          case "taskList":
            return (
              <ul className="taskList" key={key}>
                <MctAtc base={key}>{item.content}</MctAtc>
              </ul>
            );
          case "taskItem":
            return (
              <li key={key}>
                <input
                  type="checkbox"
                  title="チェック"
                  checked={item.attrs.checked}
                  readOnly
                />
                <MctAtc base={key}>{item.content}</MctAtc>
              </li>
            );
          case "blockquote":
            return (
              <blockquote key={key}>
                <MctAtc base={key}>{item.content}</MctAtc>
              </blockquote>
            );
          case "codeBlock":
            return (
              <pre key={key}>
                <code key={key}>
                  <MctAtc base={key}>{item.content}</MctAtc>
                </code>
              </pre>
            );
          case "mathBlock":
            return (
              <p className="mathBlock" key={key}>
                <em>{item.attrs.content}</em>
              </p>
            );
          case "mathInline":
            return (
              <span className="mathInline" key={key}>
                <em>{item.attrs.content}</em>
              </span>
            );
          case "details":
            return (
              <details open key={key}>
                {item.attrs.summary ? (
                  <summary>{item.attrs.summary}</summary>
                ) : null}
                {item.content ? (
                  <MctAtc base={key}>{item.content}</MctAtc>
                ) : null}
              </details>
            );
          case "linkCard":
            const title =
              item.attrs.siteName +
              (item.attrs.title ? " - " + item.attrs.title : "");
            const imageContent = item.attrs.image
              ? ({
                  type: "image",
                  attrs: {
                    src: item.attrs.image,
                    alt: title,
                    "data-uploading": null,
                    height: null,
                    width: null,
                    title,
                  },
                } as mochott_content_image)
              : null;
            return (
              <a
                href={item.attrs.url}
                title={title}
                target="_blank"
                className={imageContent ? "" : "external"}
                key={key}
              >
                {imageContent ? (
                  <MctAtc base={key}>{imageContent}</MctAtc>
                ) : (
                  title
                )}
              </a>
            );
          case "embed":
            switch (item.attrs.service) {
              case "youtube":
                return (
                  <iframe
                    src={item.attrs.embedUrl}
                    className="embed-preview-iframe"
                    allowFullScreen={true}
                    loading="lazy"
                    style={{
                      width: 560,
                      height: 315,
                    }}
                    key={key}
                  />
                );
              default:
                return (
                  <a target="_blank" className="external" key={key}>
                    {item.attrs.src}
                  </a>
                );
            }
          case "footnote":
            const map = footnoteObj.map;
            if (!map.has(key)) {
              map.set(key, [map.size + 1, item]);
              setFootnoteObj({ map });
            }
            const footnoteIndex = map.get(key)!;
            const id = url?.pathname.slice(1) + "-" + footnoteIndex[0];
            return (
              <span key={key} id={id + "-body"}>
                <sup className="footnote-ref" data-fn-index={footnoteIndex[0]}>
                  <a href={"#" + id} title={item.attrs.content}>
                    {"[" + footnoteIndex[0] + "]"}
                  </a>
                </sup>
              </span>
            );
          case "table":
            return (
              <div key={key}>
                <table>
                  <MctAtc base={key} isTableDirectry>
                    {item.content}
                  </MctAtc>
                </table>
              </div>
            );
          case "tableRow":
            return (
              <tr key={key}>
                <MctAtc base={key}>{item.content}</MctAtc>
              </tr>
            );
          case "tableHeader":
            return (
              <th key={key}>
                <MctAtc base={key}>{item.content!}</MctAtc>
              </th>
            );
          case "tableCell":
            return (
              <td key={key}>
                <MctAtc base={key}>{item.content!}</MctAtc>
              </td>
            );
          case "callout":
            return (
              <blockquote className={item.attrs.type} key={key}>
                <p>
                  {item.attrs.type === "info"
                    ? "ℹ️情報"
                    : item.attrs.type === "warning"
                      ? "⚠️情報"
                      : item.attrs.type === "tip"
                        ? "💡ヒント"
                        : item.attrs.type === "danger"
                          ? "🚨危険"
                          : null}
                </p>
                <MctAtc base={key}>{item.content}</MctAtc>
              </blockquote>
            );
          case "text":
            if (item.marks) {
              return item.marks.reduceRight<React.ReactNode>(
                (children, mark, i) => {
                  const akey = `${key}-${i}`;
                  let attr: any = {};
                  switch (mark.type) {
                    case "link":
                      let sameOrigin = false;
                      if (mark.attrs) {
                        const url = new URL(mark.attrs.href);
                        sameOrigin = url.origin === location.origin;
                        if (sameOrigin) attr.to = url.href;
                        else {
                          attr.href = url.href;
                          if (mark.attrs.target)
                            attr.target = mark.attrs.target;
                        }
                        if (mark.attrs.class) attr.className = mark.attrs.class;
                        if (mark.attrs.rel) attr.rel = mark.attrs.rel;
                        if (mark.attrs.title) attr.title = mark.attrs.title;
                      }
                      if (sameOrigin)
                        return (
                          <Link {...attr} key={akey}>
                            {children}
                          </Link>
                        );
                      else
                        return (
                          <a {...attr} key={akey} className="external">
                            {children}
                          </a>
                        );
                    case "bold":
                      return <strong key={akey}>{children}</strong>;
                    case "italic":
                      return <em key={akey}>{children}</em>;
                    case "underline":
                      return <u key={akey}>{children}</u>;
                    case "strike":
                      return <s key={akey}>{children}</s>;
                    case "code":
                      return (
                        <code className="inline" key={akey}>
                          {children}
                        </code>
                      );
                    default:
                      return children;
                  }
                },
                item.text,
              );
            }
            return item.text;
          default:
            if ("content" in item)
              return (
                <p style={style} key={key}>
                  <MctAtc base={key}>{(item as any).content}</MctAtc>
                </p>
              );
        }
        return null;
      });
    },
    [],
  );
  const footnotes = useMemo(() => {
    return Array.from(footnoteObj.map.entries());
  }, [footnoteObj]);
  return (
    <div className="parsed" key={props.base + "-root"}>
      <MctAtc {...props} />
      {footnotes.length > 0 ? <hr /> : null}
      {footnotes.map(([key, [index, value]]) => {
        const id = url?.pathname.slice(1) + "-" + index;
        return (
          <div key={key} id={id} className="footnote">
            <span className="mr-1">{index}.</span>
            {value.attrs.content}{" "}
            <a
              href={"#" + id + "-body"}
              title={index.toString()}
              className="ml-1"
            >
              <RiArrowGoBackFill />
            </a>
          </div>
        );
      })}
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
  useHotkeys("n", PostEditButtonAction());
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
  post: PostPagesItemType;
  extRss?: boolean;
  posts: PostPagesItemType[];
};
export function PostDetailFixed({
  post,
  extRss,
  ...args
}: PostDetailFixedProps) {
  const isLogin = useIsLogin()[0];
  useHotkeys("n", PostEditButtonAction(post.postId), {
    enabled: typeof post.id === "number",
  });
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
                  <PostButton postId={post.postId} />
                )
              ) : null}
            </>
          ) : null}
        </>
      }
    >
      <BackForwardPost className="list" {...args} postId={post.postId} />
      <SearchArea />
    </RbButtonArea>
  );
}

interface BackForwardPostProps extends HTMLAttributes<HTMLDivElement> {
  postId?: string;
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

export function PostEditLink(postId?: string) {
  return `/blog/post${postId ? `?target=${postId}` : ""}`;
}
export function PostEditButtonAction(postId?: string) {
  const nav = useNavigate();
  const link = PostEditLink(postId);
  return useCallback(() => nav(link), [link]);
}

export function PostButton({ postId, className, ...args }: PostButtonProps) {
  className = useMemo(() => {
    const classNames = ["round color"];
    if (className) classNames.push(className);
    return classNames.join(" ");
  }, [className]);
  return (
    <button
      {...args}
      className={className}
      onClick={PostEditButtonAction(postId)}
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
