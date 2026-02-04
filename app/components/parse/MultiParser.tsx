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
  type DOMNode,
  domToReact,
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
  mention?: boolean | Replacer;
  quoteNumberReply?: boolean | Replacer;
  widget?: boolean;
  simpleBreak?: boolean;
}
export interface MultiParserProps
  extends MultiParserOptions,
    HTMLReactParserOptions,
    React.HTMLAttributes<HTMLElement> {
  detailsOpen?: boolean;
  tag?: string;
  parsedClassName?: string;
  replaceFunction?: (args: MultiParserReplaceProps) => ChildNode | undefined;
  useEffectFunction?: () => void | Promise<void>;
  preventScrollResetSearches?: string[];
  onRender?: (elm: HTMLElement) => void;
  embedTheme?: string;
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
                  Url.searchParams.has(v),
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

const BskyHandleMap = new Map<any, string>();

export function MultiParser({
  toDom = true,
  markdown,
  linkPush,
  linkSame,
  hashtag,
  mention,
  simpleBreak,
  quoteNumberReply,
  detailsOpen = false,
  detailsClosable = true,
  widget,
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
  useEffect(() => {
    if (existCode.current) {
      (
        inRef.current?.querySelectorAll(
          `code[parsed]:not([data-highlighted])`,
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
    if (childString && simpleBreak)
      return childString.replaceAll("\n", "<br />");
    else return childString;
  }, [childString, simpleBreak]);
  childString = useMemo(() => {
    if (childString && hashtag) {
      return childString.replace(
        /(^|\s?)(#[^\s#]+)/g,
        typeof hashtag === "function"
          ? hashtag
          : (m, m1, m2) => {
              const s = createSearchParams({ q: m2 });
              return `${m1}<a href="?${s.toString()}" className="hashtag">${m2}</a>`;
            },
      );
    } else return childString;
  }, [childString, hashtag]);
  childString = useMemo(() => {
    if (childString && mention) {
      return childString.replace(
        /(^|\s?)(@[^\s#]+)/g,
        typeof mention === "function"
          ? mention
          : (m, m1, m2) => {
              const s = createSearchParams({ q: m2 });
              return `${m1}<a href="?${s.toString()}" className="mention">${m2}</a>`;
            },
      );
    } else return childString;
  }, [childString, mention]);
  childString = useMemo(() => {
    if (childString && quoteNumberReply) {
      return childString.replace(
        />(\d+)(\s|$)/g,
        typeof quoteNumberReply === "function"
          ? quoteNumberReply
          : (m, m1, m2) => `<a href="?id=${m1}">&#62;${m1}</a>${m2}`,
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
  let isBskyWidget = false;

  const ReactParserArgs = { trim, htmlparser2, library, transform };
  let parsedChildren = useMemo((): React.ReactNode => {
    if (!hidden && childString && toDom) {
      const options: HTMLReactParserOptions = {
        ...ReactParserArgs,
        transform(reactNode, domNode, index) {
          if (domNode.type === "tag") {
          }
          return reactNode as React.JSX.Element;
        },
        replace(domNode, index) {
          if (domNode.type === "tag") {
            switch (domNode.name) {
              case "code":
                domNode.attribs["parsed"] = "";
                existCode.current = true;
                break;
              case "p":
                if (
                  !domNode.parent &&
                  !domNode.children.some(
                    (c) => c.type === "text" && !/^\s*$/.test(c.data),
                  )
                ) {
                  return (
                    <div>
                      {domToReact(domNode.children as DOMNode[], options)}
                    </div>
                  );
                }
                break;
              case "a":
                if (domNode.children.length === 0) {
                  domNode.children.push(new NodeText(domNode.attribs.href));
                }
                if (linkPush) {
                  let url = domNode.attribs.href;
                  const baseHref = location.href;
                  const Url = new URL(url, baseHref);
                  if (Url.origin !== location.origin) {
                    domNode.attribs.target = "_blank";
                    if (domNode.childNodes.some((node) => node.type === "text"))
                      domNode.attribs.className =
                        (domNode.attribs.className
                          ? `${domNode.attribs.className} `
                          : "") + "external";
                  } else if (!/^[^\/]+@[^\/]+$/.test(url)) {
                    const doubleQuestion = url.startsWith("??");
                    let searchParams: URLSearchParams | undefined;
                    if (url.startsWith("?")) {
                      searchParams = new URLSearchParams(
                        doubleQuestion ? url.slice(1) : url,
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
                        domNode.attribs.href = url;
                      }
                    }
                    let preventScrollReset = Url.searchParams.has(
                      "prevent-scroll-reset",
                    );
                    if (preventScrollReset) {
                      Url.searchParams.delete("prevent-scroll-reset");
                    } else {
                      preventScrollReset =
                        (url.startsWith("?") &&
                          (Url.searchParams.has("modal") ||
                            Url.searchParams.has("image") ||
                            preventScrollResetSearches?.some((v) =>
                              Url.searchParams.has(v),
                            ))) ||
                        Boolean(Url.hash) ||
                        "prevent-scroll-reset" in domNode.attribs;
                    }
                    if (Url.searchParams.has("search-params-relative")) {
                      Url.searchParams.delete("search-params-relative");
                      const BaseUrl = new URL(baseHref);
                      BaseUrl.searchParams.forEach((v, k) => {
                        if (!Url.searchParams.has(k))
                          Url.searchParams.set(k, v);
                      });
                      domNode.attribs.href = Url.href;
                    }
                    const onClick: ((e: MouseEvent) => void) | undefined =
                      domNode.attribs.onClick as any;
                    domNode.attribs.onClick = ((e: MouseEvent) => {
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
                if (widget || domNode.attribs.title === "widget") {
                  const Url = domNode.attribs.href.startsWith("https://")
                    ? new URL(domNode.attribs.href)
                    : null;
                  if (Url) {
                    switch (Url.hostname) {
                      case "x.com":
                      case "twitter.com":
                        isTwitterWidget = true;
                        Url.hostname = "twitter.com";
                        return (
                          <blockquote className="twitter-tweet">
                            <a href={Url.href} target="_blank">
                              {domToReact(
                                domNode.children as DOMNode[],
                                options,
                              )}
                            </a>
                          </blockquote>
                        );
                    }
                  }
                  if (
                    Url?.hostname === "bsky.app" ||
                    domNode.attribs.href.startsWith("at://")
                  ) {
                    let resolveHandle: string | undefined;
                    let resolvePost: string | undefined;
                    if (Url) {
                      const m = Url.pathname.match(
                        /\/profile\/([^\/]+)\/post\/([^\/]+)/,
                      );
                      if (m) {
                        resolveHandle = m[1];
                        resolvePost = m[2];
                      }
                    }
                    isBskyWidget = true;
                    return (
                      <>
                        <blockquote
                          className="bluesky-embed"
                          data-bluesky-uri={Url ? "" : domNode.attribs.href}
                          data-resolve-handle={resolveHandle}
                          data-resolve-post={resolvePost}
                        >
                          <a href={Url?.href} target="_blank">
                            {domToReact(domNode.children as DOMNode[], options)}
                          </a>
                        </blockquote>
                      </>
                    );
                  }
                }
                break;
              case "details":
                if (detailsOpen && !("manual" in domNode.attribs))
                  domNode.attribs.open = "";
                if (detailsClosable)
                  domNode.children.push(
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
                      [new NodeText("たたむ")],
                    ),
                  );
                break;
              default:
                if (domNode.name === "li") {
                  domNode.children.forEach((c, i) => {
                    if (c.type === "text" && !/^\s*$/.test(c.data)) {
                      domNode.children[i] = new NodeElement(
                        "div",
                        {
                          className: "text",
                        },
                        [new NodeText(c.data)],
                      );
                    }
                  });
                }
                if (typeof location !== "undefined" && linkPush) {
                  const newChildren = domNode.children.reduce((a, n) => {
                    let _n: ChildNode | undefined = n;
                    if (replaceFunction) {
                      _n = replaceFunction({ linkPush, a, n });
                    }
                    if (_n) a.push(_n);
                    return a;
                  }, [] as ChildNode[]);
                  domNode.children = newChildren;
                }
                break;
            }
          }
          if (replace) {
            const result = replace(domNode, 0);
            if (result) return result;
          }
        },
      };
      return HTMLReactParser(childString, options);
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
    if (inRef.current && isTwitterWidget) {
      inRef.current.appendChild(
        createScript("https://platform.twitter.com/widgets.js"),
      );
    }
  }, [isTwitterWidget, childString]);
  useEffect(() => {
    (async () => {
      if (inRef.current && isBskyWidget) {
        const htmlClass = document.querySelector("html")?.classList;
        let theme: string | undefined;
        if (htmlClass) {
          theme = "dark";
          if (htmlClass.contains("dark")) {
          } else if (
            htmlClass.contains("auto") ||
            htmlClass.contains("system")
          ) {
            theme = "system";
          } else {
            theme = "light";
          }
        }
        await Promise.all(
          Array.from(
            inRef.current.querySelectorAll<HTMLElement>(
              "blockquote[data-bluesky-uri]",
            ),
          ).map(async (e) => {
            if (e.dataset.resolveHandle) {
              if (!BskyHandleMap.has(e.dataset.resolveHandle)) {
                await fetch(
                  "https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=" +
                    e.dataset.resolveHandle,
                  { mode: "cors" },
                )
                  .then((r) => {
                    if (r.status === 200) {
                      return r.json() as unknown as { did: string };
                    } else {
                      return { did: "" };
                    }
                  })
                  .then(({ did }) => {
                    BskyHandleMap.set(e.dataset.resolveHandle, did);
                  });
                const did = BskyHandleMap.get(e.dataset.resolveHandle);
                if (did) {
                  e.dataset.blueskyUri = `at://${did}/app.bsky.feed.post/${e.dataset.resolvePost}`;
                  delete e.dataset.resolveHandle;
                  delete e.dataset.resolvePost;
                }
              }
            }
            e.dataset.blueskyEmbedColorMode = theme;
          }),
        );
        inRef.current.appendChild(
          createScript("https://embed.bsky.app/static/embed.js"),
        );
      }
    })();
  }, [isBskyWidget, childString]);
  return React.createElement(
    tag,
    { className, ref: inRef, hidden, ...props },
    parsedChildren,
  );
}

function createScript(src: string) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  return script;
}
