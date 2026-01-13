import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createSearchParams,
  useNavigate,
  type NavigateFunction,
} from "react-router";
import HTMLReactParser, {
  type HTMLReactParserOptions,
  htmlToDOM,
} from "html-react-parser";
import {
  type ChildNode,
  Element as NodeElement,
  Text as NodeText,
} from "domhandler";
import { parse } from "marked";

type Replacer = (substring: string, ...args: any[]) => string;

export interface MultiParserOptions {
  markdown?: boolean;
  toDom?: boolean;
  detailsClosable?: boolean;
  linkPush?: boolean;
  linkSame?: boolean;
  hashtag?: boolean | Replacer;
  quoteNumberReply?: boolean | Replacer;
  widget?: boolean;
}
export interface MultiParserProps
  extends MultiParserOptions,
    HTMLReactParserOptions,
    React.HTMLAttributes<HTMLElement> {
  only?: MultiParserOptions;
  detailsOpen?: boolean;
  tag?: string;
  parsedClassName?: string;
  replaceFunction?: (args: MultiParserReplaceProps) => ChildNode | undefined;
  useEffectFunction?: () => void | Promise<void>;
  preventScrollResetSearches?: string[];
  onRender?: (elm: HTMLElement) => void;
  ref?: React.Ref<HTMLElement>;
}

export interface MultiParserReplaceProps {
  linkPush: boolean;
  a: ChildNode[];
  n: ChildNode;
}

const searchParamsRelative = "search-params-relative";

interface SetLinkPushProps {
  a: HTMLAnchorElement;
  nav: NavigateFunction;
  preventScrollReset?: boolean;
  preventScrollResetSearches?: string[];
}
export function SetLinkPush({
  a,
  nav,
  preventScrollReset,
  preventScrollResetSearches,
}: SetLinkPushProps) {
  let url = a.getAttribute("href");
  if (url) {
    if (/^\w+:\/\//.test(url)) {
      a.target = "_blank";
      if (Array.from(a.childNodes).some((node) => node.nodeType === 3))
        a.classList.add("external");
    } else if (!/^[^\/]+@[^\/]+$/.test(url)) {
      const baseHref = location.href;
      const doubleQuestion = url.startsWith("??");
      let searchParams: URLSearchParams | undefined;
      if (url.startsWith("?")) {
        searchParams = new URLSearchParams(doubleQuestion ? url.slice(1) : url);
      }
      if (searchParams) {
        let isRelative = doubleQuestion;
        if (searchParams.has(searchParamsRelative)) {
          searchParams.delete(searchParamsRelative);
          isRelative = true;
        }
        if (isRelative) {
          const BaseUrl = new URL(baseHref);
          searchParams.forEach((v, k) => {
            if (!BaseUrl.searchParams.has(k)) BaseUrl.searchParams.set(k, v);
          });
          url = BaseUrl.search;
          a.href = url;
        }
      }
      const Url = new URL(url, baseHref);
      if (typeof preventScrollReset !== "boolean") {
        preventScrollReset = Url.searchParams.has("prevent-scroll-reset");
        if (preventScrollReset) {
          Url.searchParams.delete("prevent-scroll-reset");
        } else {
          preventScrollReset =
            (url.startsWith("?") &&
              (Url.searchParams.has("modal") ||
                Url.searchParams.has("image") ||
                preventScrollResetSearches?.some((v) =>
                  Url.searchParams.has(v)
                ))) ||
            Boolean(Url.hash) ||
            a.hasAttribute("prevent-scroll-reset");
        }
      }
      if (Url.searchParams.has("search-params-relative")) {
        Url.searchParams.delete("search-params-relative");
        const BaseUrl = new URL(baseHref);
        BaseUrl.searchParams.forEach((v, k) => {
          if (!Url.searchParams.has(k)) Url.searchParams.set(k, v);
        });
        a.href = Url.href;
      }
      a.onclick = ((e: any) => {
        if (Url.href !== baseHref || window.scrollY > 0) {
          nav(Url.pathname + Url.search + Url.hash, {
            preventScrollReset,
            state: { from: location.href },
          });
        }
        e.preventDefault();
      }) as any;
    }
  }
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
  widget,
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
  useEffectFunction,
  preventScrollResetSearches,
  onRender,
  children,
  ref,
  hidden,
  ...props
}: MultiParserProps) {
  const inRef = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => inRef.current!);
  const nav = useNavigate();
  const existCode = useRef(false);
  if (only) {
    markdown = only.markdown ?? false;
    toDom = only.toDom ?? false;
    widget = only.widget ?? false;
    linkPush = only.linkPush ?? only.widget ?? false;
    hashtag = only.hashtag ?? false;
    detailsClosable = only.detailsClosable ?? false;
  }
  useEffect(() => {
    if (existCode.current) {
      (
        inRef.current?.querySelectorAll(
          `code[parsed]:not([data-highlighted])`
        ) as NodeListOf<HTMLElement>
      ).forEach((el) => {
        hljs.highlightElement(el);
      });
      existCode.current = false;
    }
    if (useEffectFunction) useEffectFunction();
    if (onRender) onRender(inRef.current!);
  }, [children]);
  let { text: childString, list } = useMemo(() => {
    let text = typeof children === "string" ? children : "";
    const list: string[] = [];
    text = text.replace(/\[.*\]\(.*\)|\<.*\>/g, (m) => {
      list.push(m);
      return `\u001B${list.length}\u001B`;
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
              return `${m1}<a href="?${s.toString()}" className="hashtag">${m2}</a>`;
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
      return childString.replace(/\u001B(\d+)\u001B/g, () => {
        return list.shift() || "";
      });
    } else return childString;
  }, [childString, list]);

  childString = useMemo(() => {
    let str = childString;
    if (str && markdown) {
      str = str.replace(/:::(.+)\n([\s\S]+):::/g, (m, m1, m2) => {
        return `<p className="${m1}">${m2}</p>`;
      });
      str = parse(str, { async: false }) as string;
    }
    return str;
  }, [childString, markdown]);
  let isTwitterWidget = false;

  const ReactParserArgs = { trim, htmlparser2, library, transform };
  let parsedChildren = useMemo((): React.ReactNode => {
    if (!hidden && childString && toDom) {
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
                    let url = v.attribs.href;
                    if (/^\w+:\/\//.test(url)) {
                      v.attribs.target = "_blank";
                      if (v.childNodes.some((node) => node.type === "text"))
                        v.attribs.className =
                          (v.attribs.className
                            ? `${v.attribs.className} `
                            : "") + "external";
                    } else if (!/^[^\/]+@[^\/]+$/.test(url)) {
                      const baseHref = location.href;
                      const doubleQuestion = url.startsWith("??");
                      let searchParams: URLSearchParams | undefined;
                      if (url.startsWith("?")) {
                        searchParams = new URLSearchParams(
                          doubleQuestion ? url.slice(1) : url
                        );
                      }
                      if (searchParams) {
                        let isRelative = doubleQuestion;
                        if (searchParams.has(searchParamsRelative)) {
                          searchParams.delete(searchParamsRelative);
                          isRelative = true;
                        }
                        if (isRelative) {
                          const BaseUrl = new URL(baseHref);
                          searchParams.forEach((v, k) => {
                            if (!BaseUrl.searchParams.has(k))
                              BaseUrl.searchParams.set(k, v);
                          });
                          url = BaseUrl.search;
                          v.attribs.href = url;
                        }
                      }
                      const Url = new URL(url, baseHref);
                      let preventScrollReset = Url.searchParams.has(
                        "prevent-scroll-reset"
                      );
                      if (preventScrollReset) {
                        Url.searchParams.delete("prevent-scroll-reset");
                      } else {
                        preventScrollReset =
                          (url.startsWith("?") &&
                            (Url.searchParams.has("modal") ||
                              Url.searchParams.has("image") ||
                              preventScrollResetSearches?.some((v) =>
                                Url.searchParams.has(v)
                              ))) ||
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
                      const onClick: ((e: MouseEvent) => void) | undefined = v
                        .attribs.onClick as any;
                      v.attribs.onClick = ((e: MouseEvent) => {
                        if (onClick) onClick(e);
                        if (!e.defaultPrevented) {
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
                        }
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
                  if (v.name === "li") {
                    v.children.forEach((c, i) => {
                      if (c.type === "text" && !/^\s*$/.test(c.data)) {
                        v.children[i] = new NodeElement(
                          "div",
                          {
                            className: "text",
                          },
                          [new NodeText(c.data)]
                        );
                      }
                    });
                  }
                  if (widget && v.type === "tag" && v.name !== "blockquote") {
                    v.children.forEach((c, i) => {
                      if (
                        c.type === "tag" &&
                        c.name === "a" &&
                        c.attribs.href.startsWith("https://")
                      ) {
                        const Url = new URL(c.attribs.href);
                        if (Url.hostname === "x.com") {
                          Url.hostname = "twitter.com";
                          c.attribs.href = Url.href;
                        }
                        if (Url.hostname === "twitter.com") {
                          isTwitterWidget = true;
                          v.children[i] = v.children[i] = new NodeElement(
                            "blockquote",
                            {
                              className: "twitter-tweet",
                            },
                            [c]
                          );
                        }
                      }
                    });
                  }
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
    hidden,
    children,
    childString,
    toDom,
    ReactParserArgs,
    linkPush,
    detailsOpen,
    detailsClosable,
    preventScrollResetSearches,
    isTwitterWidget,
  ]);
  parsedChildren = useMemo(() => {
    function setBodyInner(node: React.ReactNode) {
      let nodes = Array.isArray(node) ? node : [node];
      nodes = nodes.map((node) => {
        if (node && typeof node === "object" && "props" in node) {
          switch (node.type) {
            case "html":
              return setBodyInner(node.props.children);
            case "head":
              return null;
            case "body":
              return setBodyInner(node.props.children);
            default:
              return node;
          }
        } else return node;
      });
      return nodes.filter((v) => v);
    }
    const nodes = setBodyInner(parsedChildren);
    if (nodes.length <= 1) return nodes[0];
    else return <>{nodes}</>;
  }, [parsedChildren]);
  className = (className ? `${className} ` : "") + parsedClassName;
  useEffect(() => {
    if (isTwitterWidget) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://platform.twitter.com/widgets.js";
      inRef.current?.appendChild(script);
    }
  }, [isTwitterWidget]);
  return React.createElement(
    tag,
    { className, ref: inRef, hidden, ...props },
    parsedChildren
  );
}
