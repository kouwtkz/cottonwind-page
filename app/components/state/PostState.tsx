import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { postsDataIndexed, waitIdb } from "~/data/ClientDBLoader";
import { CreateObjectState } from "./CreateState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";
import { SubscribeDataClass } from "../hook/SubscribeEvents";
import { useExtRss } from "./ExtRssState";
import { useATProtoState } from "./ATProtocolState";
import { Link } from "react-router";
import { RiArrowGoBackFill } from "react-icons/ri";

interface usePostsType {
  posts?: PostType[];
  postsMap?: Map<string, PostType>;
  postsData?: MeeIndexedDBTable<PostType>;
}
export const usePosts = CreateObjectState<usePostsType>();

interface Mochott_Article_Props {
  children: Mochott_Content_General_Union | Mochott_Content_General_Union[];
  base: string;
  url?: URL;
}
function Mochott_Article({ url, ...props }: Mochott_Article_Props) {
  const [footnoteObj, setFootnoteObj] = useState<{
    map: Map<string, [number, Mochott_Content_Footnote]>;
  }>({ map: new Map() });
  const MctAtc = useCallback(
    ({ children: argsChild, base }: Mochott_Article_Props) => {
      const children = Array.isArray(argsChild) ? argsChild : [argsChild];
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
                <p style={style}>
                  <MctAtc base={key}>{item.content}</MctAtc>
                </p>
              );
            break;
          case "heading":
            if (item.content)
              switch (item.attrs.level) {
                case 2:
                  return (
                    <h2 style={style}>
                      <MctAtc base={key}>{item.content}</MctAtc>
                    </h2>
                  );
                case 3:
                  return (
                    <h3 style={style}>
                      <MctAtc base={key}>{item.content}</MctAtc>
                    </h3>
                  );
                case 4:
                  return (
                    <h4 style={style}>
                      <MctAtc base={key}>{item.content}</MctAtc>
                    </h4>
                  );
              }
            break;
          case "image":
            const srcUrl = new URL(item.attrs.src, url?.href);
            return (
              <figure>
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
              <pre>
                <code key={key}>
                  <MctAtc base={key}>{item.content}</MctAtc>
                </code>
              </pre>
            );
          case "mathBlock":
            return (
              <p className="mathBlock">
                <em>{item.attrs.content}</em>
              </p>
            );
          case "mathInline":
            return (
              <span className="mathInline">
                <em>{item.attrs.content}</em>
              </span>
            );
          case "details":
            return (
              <details open>
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
                } as Mochott_Content_Image)
              : null;
            return (
              <a
                href={item.attrs.url}
                title={title}
                target="_blank"
                className={imageContent ? "" : "external"}
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
                  />
                );
              default:
                return (
                  <a target="_blank" className="external">
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
              <p key={key}>
                <table>
                  <MctAtc base={key}>{item.content}</MctAtc>
                </table>
              </p>
            );
          case "tableRow":
            return (
              <tr>
                <MctAtc base={key}>{item.content}</MctAtc>
              </tr>
            );
          case "tableHeader":
            return (
              <th>
                <MctAtc base={key}>{item.content!}</MctAtc>
              </th>
            );
          case "tableCell":
            return (
              <td>
                <MctAtc base={key}>{item.content!}</MctAtc>
              </td>
            );
          case "callout":
            return (
              <blockquote className={item.attrs.type}>
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
                <p style={style}>
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
    <>
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
    </>
  );
}

export default function PostState() {
  const { Set, posts } = usePosts();
  const postsData = useSyncExternalStore(
    ...ExternalStoreProps(postsDataIndexed),
  );
  const extRss = useExtRss();
  const { mochott_Article } = useATProtoState();
  const mixPosts = useMemo(() => {
    const list: PostPagesItemType[] = posts ? posts.concat() : [];
    if (extRss) {
      extRss.forEach((channel) => {
        const topLink = channel.link;
        const topLinkURL = new URL(topLink);
        const host = topLinkURL.host;
        channel.items.forEach((item) => {
          list.push({
            host,
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
    if (mochott_Article) {
      mochott_Article.forEach((item) => {
        if (item.minisite && item.minisite.designType !== "blog") return;
        const postId = item.$type + item.path;
        const body = (
          <div className="parsed">
            <Mochott_Article base={postId} url={item.url}>
              {item.content.content}
            </Mochott_Article>
          </div>
        );
        const category: string[] = [];
        if (item.category) category.push(item.category);
        if (item.tags) category.push(...item.tags);
        list.push({
          host: item.host,
          extension: "Mochott",
          title: item.title,
          body,
          time: new Date(item.createdAt),
          link: item.url?.href,
          postId,
          category,
          draft: false,
        });
      });
    }
    return list;
  }, [posts, extRss, mochott_Article]);
  useEffect(() => {
    (async () => {
      await waitIdb;
      if (postsData?.db) {
        postsData
          .find({ where: { body: { has: true }, postId: { has: true } } })
          .then((posts) => {
            const postsMap = new Map(posts.map((v) => [v.postId!, v]));
            Set({ postsData, posts, postsMap });
          });
      }
    })();
  }, [postsData, Set]);
  useEffect(() => {
    MixPosts.SetData(mixPosts);
  }, [mixPosts]);
  return <></>;
}

export const MixPosts = new SubscribeDataClass<PostPagesItemType[] | null>(
  null,
);

export function useMixPosts() {
  return useSyncExternalStore(
    MixPosts.subscribeEvent.subscribe,
    MixPosts.GetData.bind(MixPosts),
    () => null,
  );
}
