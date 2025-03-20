import React, { useEffect, useMemo, useRef } from "react";
import HTMLReactParser, {
  HTMLReactParserOptions,
  htmlToDOM,
} from "html-react-parser";
import {
  ChildNode,
  Element as NodeElement,
  Text as NodeText,
} from "domhandler";
import { parse } from "marked";
import { createSearchParams, useNavigate } from "react-router-dom";

type Replacer = (substring: string, ...args: any[]) => string;

export interface MultiParserOptions {
  markdown?: boolean;
  toDom?: boolean;
  detailsClosable?: boolean;
  linkPush?: boolean;
  linkSame?: boolean;
  hashtag?: boolean | Replacer;
  quoteNumberReply?: boolean | Replacer;
}
export interface MultiParserProps
  extends MultiParserOptions,
    HTMLReactParserOptions {
  only?: MultiParserOptions;
  className?: string;
  detailsOpen?: boolean;
  tag?: string;
  children?: React.ReactNode;
  parsedClassName?: string;
  replaceFunction?: (args: MultiParserReplaceProps) => ChildNode | undefined;
}

export interface MultiParserReplaceProps {
  linkPush: boolean;
  a: ChildNode[];
  n: ChildNode;
}

export function MultiParser({
  markdown = true,
  toDom = true,
  linkPush = true,
  linkSame = true,
  hashtag = true,
  quoteNumberReply = false,
  detailsOpen = false,
  detailsClosable = true,
  only,
  className,
  tag = "div",
  parsedClassName = "parsed",
  trim,
  replace,
  htmlparser2,
  library,
  transform,
  replaceFunction,
  children,
}: MultiParserProps) {
  const nav = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const existCode = useRef(false);
  if (only) {
    markdown = only.markdown ?? false;
    toDom = only.toDom ?? false;
    linkPush = only.linkPush ?? false;
    hashtag = only.hashtag ?? false;
    detailsClosable = only.detailsClosable ?? false;
  }
  useEffect(() => {
    if (existCode.current) {
      (
        ref.current?.querySelectorAll(
          `code[parsed]:not([data-highlighted])`
        ) as NodeListOf<HTMLElement>
      ).forEach((el) => {
        hljs.highlightElement(el);
      });
      existCode.current = false;
    }
  }, [children]);
  let { text: childString, list } = useMemo(() => {
    let text = typeof children === "string" ? children : "";
    const list: string[] = [];
    text = text.replace(/\[.*\]\(.*\)|\<.*\>/g, (m) => {
      list.push(m);
      return `$\u009F${list.length}`;
    });
    return { text, list };
  }, [children]);
  childString = useMemo(() => {
    if (childString && hashtag) {
      return childString.replace(
        /(^|\s?)(#[^\s#]+)/g,
        typeof hashtag === "function"
          ? hashtag
          : (m, m1, m2) => {
              const s = createSearchParams({ q: m2 });
              return `${m1}<a href="?${s.toString()}" class="hashtag">${m2}</a>`;
            }
      );
    } else return childString;
  }, [childString, hashtag]);
  childString = useMemo(() => {
    if (childString && quoteNumberReply) {
      return childString.replace(
        />(\d+)(\s|$)/g,
        typeof quoteNumberReply === "function"
          ? quoteNumberReply
          : (m, m1, m2) => `<a href="?id=${m1}">&#62;${m1}</a>${m2}`
      );
    } else return childString;
  }, [childString, quoteNumberReply]);
  childString = useMemo(() => {
    if (list.length > 0) {
      return childString.replace(/\$\u009F(\d+)/g, () => {
        return list.shift() || "";
      });
    } else return childString;
  }, [childString, list]);

  childString = useMemo(() => {
    if (childString && markdown)
      return parse(childString, { async: false }) as string;
    else return childString;
  }, [childString, markdown]);
  const ReactParserArgs = { trim, htmlparser2, library, transform };
  const parsedChildren = useMemo((): React.ReactNode => {
    if (childString && toDom) {
      return HTMLReactParser(childString, {
        ...ReactParserArgs,
        replace: (v) => {
          switch (v.type) {
            case "tag":
              switch (v.name) {
                case "code":
                  v.attribs["parsed"] = "";
                  existCode.current = true;
                  break;
                case "a":
                  if (linkPush) {
                    const url = v.attribs.href;
                    if (/^\w+:\/\//.test(url)) {
                      v.attribs.target = "_blank";
                      if (v.childNodes.some((node) => node.type === "text"))
                        v.attribs.class =
                          (v.attribs.class ? `${v.attribs.class} ` : "") +
                          "external";
                    } else if (!/^[^\/]+@[^\/]+$/.test(url)) {
                      const baseHref = location.href;
                      const Url = new URL(url, baseHref);
                      let preventScrollReset = Url.searchParams.has(
                        "prevent-scroll-reset"
                      );
                      if (preventScrollReset) {
                        Url.searchParams.delete("prevent-scroll-reset");
                      } else {
                        preventScrollReset =
                          Url.searchParams.has("modal") ||
                          Boolean(Url.hash) ||
                          "prevent-scroll-reset" in v.attribs;
                      }
                      if (Url.searchParams.has("search-params-relative")) {
                        Url.searchParams.delete("search-params-relative");
                        const BaseUrl = new URL(baseHref);
                        BaseUrl.searchParams.forEach((v, k) => {
                          if (!Url.searchParams.has(k))
                            Url.searchParams.set(k, v);
                        });
                        v.attribs.href = Url.href;
                      }
                      v.attribs.onClick = ((e: any) => {
                        if (
                          Url.href !== baseHref ||
                          (linkSame && window.scrollY > 0)
                        ) {
                          nav(Url.pathname + Url.search + Url.hash, {
                            preventScrollReset,
                            state: { from: location.href },
                          });
                        }
                        e.preventDefault();
                      }) as any;
                    }
                  }
                  break;
                case "details":
                  if (detailsOpen && !("manual" in v.attribs))
                    v.attribs.open = "";
                  if (detailsClosable)
                    v.children.push(
                      new NodeElement(
                        "button",
                        {
                          className: "close",
                          onClick: ((e: any) => {
                            e.target.parentElement.removeAttribute("open");
                          }) as any,
                          title: "折りたたむ",
                          type: "button",
                        },
                        [new NodeText("たたむ")]
                      )
                    );
                  break;
                default:
                  if (typeof location !== "undefined" && linkPush) {
                    const newChildren = v.children.reduce((a, n) => {
                      let _n: ChildNode | undefined = n;
                      if (replaceFunction) {
                        _n = replaceFunction({ linkPush, a, n });
                      }
                      if (_n) a.push(_n);
                      return a;
                    }, [] as ChildNode[]);
                    v.children = newChildren;
                  }
                  break;
              }
          }
          if (replace) replace(v, 0);
        },
      });
    } else return children;
  }, [
    children,
    childString,
    toDom,
    ReactParserArgs,
    linkPush,
    detailsOpen,
    detailsClosable,
  ]);
  className = (className ? `${className} ` : "") + parsedClassName;
  return <>{React.createElement(tag, { className, ref }, parsedChildren)}</>;
}
