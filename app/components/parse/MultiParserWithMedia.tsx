import { useImageState } from "~/components/state/ImageState";
import {
  MultiParser,
  type MultiParserProps,
  type MultiParserReplaceProps,
} from "./MultiParser";
import { Element as NodeElement, Text as NodeText } from "domhandler";
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
  const MultiParserReplace = useCallback(
    ({ linkPush, n }: MultiParserReplaceProps) => {
      if (n.type === "tag") {
        if (linkPush && imagesMap && n.name === "img") {
          let src = n.attribs.src;
          const baseHref = location.href;
          const Url = new URL(baseHref);
          const srcSearchParams = new URLSearchParams(src);
          srcSearchParams.forEach((v, k) => {
            Url.searchParams.append(k, v);
          });
          const imageKey = srcSearchParams.get("image");
          let pagenameFlag =
            location.host === Url.host && location.pathname === Url.pathname;
          if (pagenameFlag && !/^\w+:\/\//.test(src)) {
            const imageItem = imageKey ? imagesMap.get(imageKey) : null;
            if (imageItem) {
              const srcUrl = imageItem.src
                ? new URL(concatOriginUrl(mediaOrigin, imageItem.src), baseHref)
                : null;
              if (srcUrl) {
                if (imageItem.version && imageItem.version > 1) {
                  srcUrl.searchParams.set("v", imageItem.version.toString());
                }
                n.attribs.src = srcUrl.href;
              }
              n.attribs.title = n.attribs.alt || imageItem.title || "";
              n.attribs.alt = n.attribs.title;
              if (imageItem.width) n.attribs.width = String(imageItem.width);
              if (imageItem.height) n.attribs.height = String(imageItem.height);
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
        if (n.name === "a" && n.attribs.href.startsWith("link:")) {
          const value = decodeURI(n.attribs.href.slice(5));
          const link = linksMap?.get(value);
          if (link) {
            if (n.children.length === 0) {
              n.children.push(new NodeText(link.title || link.key || value));
            }
            n.attribs.title = getTitleWithDsc(link);
            n.attribs.href = link.url || "";
            if (!n.attribs.href) {
              n.attribs.onClick = ((e: MouseEvent) => {
                if (typeof link.id === "number") verify(link.id);
                e.preventDefault();
              }) as any;
            } else {
              n.attribs.target = "_blank";
            }
          }
        }
        if (n.name === "a" && n.attribs.href.startsWith("copy:")) {
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
