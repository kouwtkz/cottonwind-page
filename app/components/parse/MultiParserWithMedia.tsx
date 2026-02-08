import { useImageState } from "~/components/state/ImageState";
import {
  MultiParser,
  type MultiParserProps,
  type MultiParserReplaceProps,
  type ReplaceReturnType,
} from "./MultiParser";
import {
  Element as NodeElement,
  Text as NodeText,
  type ChildNode,
} from "domhandler";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { useCallback, type ReactNode } from "react";
import { CopyWithToast } from "~/components/functions/toastFunction";
import { mediaOrigin } from "~/data/ClientDBLoader";
import { useLinks } from "../state/LinksState";
import { getTitleWithDsc } from "~/page/LinksPage";
import type { JSX } from "@fullcalendar/core/preact.js";
import { Link } from "react-router";
import { domToReact, type DOMNode } from "html-react-parser";

export interface MultiParserWithMediaProps
  extends Omit<MultiParserProps, "replaceFunctions"> {}

export function MultiParserWithMedia(args: MultiParserWithMediaProps) {
  const { imagesMap } = useImageState();
  const { linksMap, verify } = useLinks();
  const copyAction = useCallback(
    (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      const elm = e.target as HTMLElement;
      if (elm?.dataset.copy) CopyWithToast(elm.dataset.copy);
    },
    [],
  );
  const getImageSrc = useCallback(
    (imageItem: ImageType, baseHref = location.href) => {
      const srcUrl = imageItem.src
        ? new URL(concatOriginUrl(mediaOrigin, imageItem.src), baseHref)
        : null;
      if (srcUrl) {
        if (imageItem.version && imageItem.version > 1) {
          srcUrl.searchParams.set("v", imageItem.version.toString());
        }
        return srcUrl.href;
      } else return "";
    },
    [],
  );
  const LinkCallback = useCallback(
    ({ src, alt, banner }: { src: string; alt: string; banner?: boolean }) => {
      const value = decodeURI(src.slice(5));
      const link = linksMap?.get(value);
      if (link && !alt) {
        alt = link.title || link.key || value;
      }
      function A({
        className,
        children,
      }: {
        className?: string;
        children?: ReactNode;
      }) {
        if (link) {
          const isPassLock = !link.url && link.password;
          const titleWithDsc = (isPassLock ? "🔒" : "") + getTitleWithDsc(link);
          if (!src) {
            return (
              <a
                href={link.url || ""}
                title={titleWithDsc}
                target="_blank"
                className={className}
                onClick={(e) => {
                  if (typeof link.id === "number") verify(link.id);
                  e.preventDefault();
                }}
              >
                {children || alt}
              </a>
            );
          }
        }
        return (
          <a className={className} href={src} title={alt} target="_blank">
            {children || alt}
          </a>
        );
      }
      if (banner) {
        return (
          <A className="overlay">
            <div className="bannerArea">
              {link?.Image ? (
                <img
                  src={getImageSrc(link.Image)}
                  className="banner"
                  alt={alt}
                />
              ) : (
                <div className="banner">
                  <span className="plane" />
                </div>
              )}
            </div>
          </A>
        );
      }
      return <A />;
    },
    [linksMap],
  );
  const MultiParserReplace = useCallback<
    (a: MultiParserReplaceProps) => ReplaceReturnType
  >(
    ({ options, linkPush, domNode, index }) => {
      if (domNode.type === "tag") {
        switch (domNode.name) {
          case "img":
            if (domNode.attribs.src.startsWith("link:")) {
              return LinkCallback({
                src: domNode.attribs.src,
                alt: domNode.attribs.alt,
                banner: true,
              });
            } else if (linkPush && imagesMap) {
              let src = domNode.attribs.src;
              const baseHref = location.href;
              const Url = new URL(baseHref);
              const srcSearchParams = new URLSearchParams(src);
              srcSearchParams.forEach((v, k) => {
                Url.searchParams.append(k, v);
              });
              const imageKey = srcSearchParams.get("image");
              let pagenameFlag =
                location.host === Url.host &&
                location.pathname === Url.pathname;
              if (pagenameFlag && !/^\w+:\/\//.test(src)) {
                const imageItem = imageKey ? imagesMap.get(imageKey) : null;
                if (imageItem) {
                  domNode.attribs.src =
                    getImageSrc(imageItem, baseHref) || domNode.attribs.src;
                  domNode.attribs.title =
                    domNode.attribs.alt || imageItem.title || "";
                  domNode.attribs.alt = domNode.attribs.title;
                  if (imageItem.width)
                    domNode.attribs.width = String(imageItem.width);
                  if (imageItem.height)
                    domNode.attribs.height = String(imageItem.height);
                  Url.searchParams.delete("pic");
                  Url.searchParams.set("image", imageItem.key);
                  return (
                    <Link to={Url.search} preventScrollReset>
                      {domToReact([domNode], options)}
                    </Link>
                  );
                }
              }
            }
            break;
          case "a":
            if (domNode.attribs.href.startsWith("link:")) {
              return (
                <LinkCallback
                  src={domNode.attribs.href}
                  alt={domNode.children.reduce(
                    (a, c) => (c.type === "text" ? a + c.data : a),
                    "",
                  )}
                  banner={false}
                />
              );
            } else if (domNode.attribs.href.startsWith("copy:")) {
              const value = decodeURI(domNode.attribs.href.slice(5));
              return (
                <span
                  className="color-deep pointer pre"
                  onClick={copyAction}
                  data-copy={value}
                >
                  {domNode.children.length
                    ? domToReact(domNode.children as DOMNode[], options)
                    : value}
                </span>
              );
            }
            break;
        }
      }
      return domNode;
    },
    [imagesMap, linksMap],
  );
  return MultiParser({
    ...args,
    replaceFunction: MultiParserReplace,
    preventScrollResetSearches: ["fc-event-id"],
  });
}
