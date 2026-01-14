import { useImageState } from "~/components/state/ImageState";
import {
  MultiParser,
  type MultiParserProps,
  type MultiParserReplaceProps,
} from "./MultiParser";
import {
  Element as NodeElement,
  Text as NodeText,
  type ChildNode,
} from "domhandler";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { useCallback } from "react";
import { CopyWithToast } from "~/components/functions/toastFunction";
import { mediaOrigin } from "~/data/ClientDBLoader";
import { useLinks } from "../state/LinksState";
import { getTitleWithDsc } from "~/page/LinksPage";

export interface MultiParserWithMediaProps
  extends Omit<MultiParserProps, "replaceFunctions"> {}

export function MultiParserWithMedia(args: MultiParserWithMediaProps) {
  const { imagesMap } = useImageState();
  const { linksMap, verify } = useLinks();
  const copyAction = useCallback((e: MouseEvent) => {
    const elm = e.target as HTMLElement;
    if (elm?.dataset.copy) CopyWithToast(elm.dataset.copy);
  }, []);
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
    []
  );
  const Link = useCallback(
    ({ src, alt, banner }: { src: string; alt: string; banner?: boolean }) => {
      const value = decodeURI(src.slice(5));
      const link = linksMap?.get(value);
      const a = new NodeElement("a", { href: src }, []);
      if (link) {
        if (!alt) {
          alt = link.title || link.key || value;
        }
        a.children = [new NodeText(alt)];
        a.attribs.title = getTitleWithDsc(link);
        a.attribs.href = link.url || "";
        if (!a.attribs.href) {
          a.attribs.onClick = ((e: MouseEvent) => {
            if (typeof link.id === "number") verify(link.id);
            e.preventDefault();
          }) as any;
        } else {
          a.attribs.target = "_blank";
        }
      }
      if (banner) {
        const b = new NodeElement("div", { class: "bannerArea" }, [a]);
        if (link?.Image) {
          const c = new NodeElement("img", {
            src: getImageSrc(link.Image),
            class: "banner",
            alt,
          });
          a.attribs.class = "overlay";
          a.children = [c];
        } else {
          const c = new NodeElement("div", { class: "banner" }, [
            new NodeElement("span", { class: "plane" }, a.children),
          ]);
          a.children = [c];
        }
        return b;
      } else return a;
    },
    [linksMap]
  );
  const MultiParserReplace = useCallback(
    ({ linkPush, n }: MultiParserReplaceProps) => {
      if (n.type === "tag") {
        switch (n.name) {
          case "img":
            if (n.attribs.src.startsWith("link:")) {
              return Link({
                src: n.attribs.src,
                alt: n.attribs.alt,
                banner: true,
              });
            } else if (linkPush && imagesMap) {
              let src = n.attribs.src;
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
                  n.attribs.src =
                    getImageSrc(imageItem, baseHref) || n.attribs.src;
                  n.attribs.title = n.attribs.alt || imageItem.title || "";
                  n.attribs.alt = n.attribs.title;
                  if (imageItem.width)
                    n.attribs.width = String(imageItem.width);
                  if (imageItem.height)
                    n.attribs.height = String(imageItem.height);
                  Url.searchParams.delete("pic");
                  Url.searchParams.set("image", imageItem.key);
                }
                return new NodeElement(
                  "a",
                  { href: Url.search, "prevent-scroll-reset": "" },
                  [n]
                );
              }
            }
            break;
          case "a":
            if (n.attribs.href.startsWith("link:")) {
              return Link({
                src: n.attribs.href,
                alt: n.children.reduce(
                  (a, c) => (c.type === "text" ? a + c.data : a),
                  ""
                ),
                banner: false,
              });
            } else if (n.attribs.href.startsWith("copy:")) {
              const value = decodeURI(n.attribs.href.slice(5));
              return new NodeElement(
                "span",
                {
                  class: "color-deep pointer pre",
                  onClick: copyAction as any,
                  "data-copy": value,
                },
                n.children.length ? n.children : [new NodeText(value)]
              );
            }
            break;
        }
      }
      return n;
    },
    [imagesMap, linksMap]
  );
  return MultiParser({
    ...args,
    replaceFunction: MultiParserReplace,
    preventScrollResetSearches: ["fc-event-id"],
  });
}
