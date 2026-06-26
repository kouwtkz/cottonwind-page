import { useCallback, useEffect, useMemo, useState } from "react";
import { RiArrowGoBackFill } from "react-icons/ri";
import { Link } from "react-router";

interface MochottArticle_Props {
  children: mochott_content_general_union | mochott_content_general_union[];
  base: string;
  url?: URL;
}
interface _mochottArticle_Props extends Omit<MochottArticle_Props, "url"> {
  isTableDirectry?: boolean;
}
export function MochottArticle({ url, ...props }: MochottArticle_Props) {
  const [footnoteObj, setFootnoteObj] = useState<{
    map: Map<string, [number, mochott_content_footnote]>;
  }>({ map: new Map() });
  const MctAtc = useCallback(
    ({ children: argsChild, base, isTableDirectry }: _mochottArticle_Props) => {
      const [footnoteUpdate, setFootnoteUpdate] = useState<boolean>(false);
      useEffect(() => {
        if (footnoteUpdate) {
          setFootnoteObj({ map: footnoteObj.map });
        }
      }, [footnoteUpdate]);
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
              setFootnoteUpdate(true);
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
