import React from "react";
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
import { useNavigate } from "react-router-dom";
import { GetUrlFlag, MakeRelativeURL, ToURL } from "./MakeURL";
import { GetImageItemFromSrc } from "../layout/ImageMee";
// import { useMediaImageState } from "@/app/context/image/MediaImageState";
// import { useSiteState } from "@/app/context/site/SiteState";

type MultiParserOptions = {
  markdown?: boolean;
  toDom?: boolean;
  detailsClosable?: boolean;
  linkPush?: boolean;
  hashtag?: boolean;
};
type MultiParserProps = MultiParserOptions &
  HTMLReactParserOptions & {
    only?: MultiParserOptions;
    className?: string;
    detailsOpen?: boolean;
    tag?: string;
    children?: React.ReactNode;
    parsedClassName?: string;
  };

function MultiParser({
  markdown = true,
  toDom = true,
  linkPush = true,
  hashtag = true,
  detailsOpen = false,
  detailsClosable = true,
  only,
  className,
  tag = "div",
  parsedClassName = "parsed",
  trim = true,
  replace,
  htmlparser2,
  library,
  transform,
  children,
}: MultiParserProps) {
  const nav = useNavigate();
  // const { imageItemList, isSet: imagesIsSet } = useMediaImageState();
  // const { site } = useSiteState();
  if (only) {
    markdown = only.markdown ?? false;
    toDom = only.toDom ?? false;
    linkPush = only.linkPush ?? false;
    hashtag = only.hashtag ?? false;
    detailsClosable = only.detailsClosable ?? false;
  }
  if (typeof children === "string") {
    let childString = children;
    if (markdown) childString = parse(childString, { async: false }) as string;
    if (toDom) {
      let currentTag = "";
      children = HTMLReactParser(childString, {
        trim,
        htmlparser2,
        library,
        transform,
        replace: (v) => {
          switch (v.type) {
            case "tag":
              switch (v.name) {
                case "a":
                  if (linkPush) {
                    currentTag = v.name;
                    const url = v.attribs.href;
                    if (/^\w+:\/\//.test(url)) {
                      v.attribs.target = "_blank";
                      v.attribs.class =
                        (v.attribs.class ? `${v.attribs.class} ` : "") +
                        "external";
                    } else {
                      v.attribs.onClick = ((e: any) => {
                        const queryFlag = url.startsWith("?");
                        let query = queryFlag
                          ? Object.fromEntries(new URLSearchParams(url))
                          : {};
                        if (queryFlag) {
                          const scroll = query.scroll === "true";
                          if (query.scroll) delete query.scroll;
                          query = {
                            ...Object.fromEntries(
                              new URLSearchParams(location.search)
                            ),
                            ...query,
                          };
                          nav(MakeRelativeURL({ query }), {
                            preventScrollReset: scroll,
                          });
                        } else {
                          nav(MakeRelativeURL(url));
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
                        },
                        [new NodeText("たたむ")]
                      )
                    );
                  break;
                case "ul":
                  let ulAdd = "";
                  if ("data-kind" in v.attribs) {
                    switch (v.attribs["data-kind"]) {
                      case "sns":
                        // ulAdd =
                        //   site?.menu?.sns
                        //     ?.filter(({ hidden, none }) => !(hidden || none))
                        //     .map(
                        //       (item) =>
                        //         `<li><a href="${item.url}">${item.name}</a></li>`
                        //     )
                        //     .join("") || "";
                        break;
                    }
                  }
                  if (ulAdd)
                    htmlToDOM(ulAdd).forEach((n) => v.children.push(n));
                  break;
                default:
                  // if (typeof location === "undefined" || !(hashtag || linkPush))
                  //   return;
                  // const newChildren = v.children.reduce((a, n) => {
                  //   if (hashtag && n.type === "text") {
                  //     if (!/^a$/.test(currentTag) && !/^\s*$/.test(n.data)) {
                  //       const replaced = n.data.replace(
                  //         /(^|\s?)(#[^\s#]+)/g,
                  //         (m, m1, m2) => {
                  //           const url = MakeRelativeURL({
                  //             query: { q: m2 },
                  //           });
                  //           return `${m1}<a href="${url}">${m2}</a>`;
                  //         }
                  //       );
                  //       if (n.data !== replaced) {
                  //         htmlToDOM(replaced).forEach((n) => a.push(n));
                  //         return a;
                  //       }
                  //     }
                  //   } else if (
                  //     linkPush &&
                  //     n.type === "tag" &&
                  //     n.name === "img"
                  //   ) {
                  //     let src = n.attribs.src;
                  //     let Url = ToURL(src);
                  //     let params: { [k: string]: any } = {};
                  //     let { pathname: pagenameFlag } = GetUrlFlag(Url);
                  //     if (pagenameFlag && !/^\w+:\/\//.test(src)) {
                  //       if (!imagesIsSet) n.attribs.src = "";
                  //       else {
                  //         const toSearch = Object.fromEntries(Url.searchParams);
                  //         const imageItem = imagesIsSet
                  //           ? GetImageItemFromSrc({
                  //               src: { query: toSearch },
                  //               list: imageItemList,
                  //             })
                  //           : null;
                  //         if (imageItem) {
                  //           n.attribs.src = imageItem.URL || "";
                  //           n.attribs.title = n.attribs.alt || imageItem.name;
                  //           n.attribs.alt = n.attribs.title;
                  //           if ("pic" in toSearch) params.pic = "";
                  //           params.image = toSearch.image;
                  //         }
                  //       }
                  //       a.push(
                  //         new NodeElement(
                  //           "a",
                  //           {
                  //             href: MakeURL({
                  //               query: {
                  //                 ...Object.fromEntries(
                  //                   new URLSearchParams(location.search)
                  //                 ),
                  //                 ...params,
                  //               },
                  //             }).search,
                  //           },
                  //           [n]
                  //         )
                  //       );
                  //       return a;
                  //     }
                  //   }
                  //   a.push(n);
                  //   return a;
                  // }, [] as ChildNode[]);
                  // v.children = newChildren;
                  break;
              }
          }
          if (replace) replace(v, 0);
        },
      });
    } else children = childString;
  }
  className = (className ? `${className} ` : "") + parsedClassName;
  return React.createElement(tag, { className }, children);
}

export default MultiParser;
