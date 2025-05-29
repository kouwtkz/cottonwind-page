import { useImageState } from "@src/state/ImageState";
import { useMediaOrigin } from "@src/state/EnvState";
import {
  MultiParser,
  MultiParserProps,
  MultiParserReplaceProps,
} from "./MultiParser";
import { Element as NodeElement, Text as NodeText } from "domhandler";
import { concatOriginUrl } from "@src/functions/originUrl";
import { useCallback } from "react";
import { CopyWithToast } from "@src/functions/toastFunction";

interface MultiParserWithMediaProps
  extends Omit<MultiParserProps, "replaceFunctions"> {}

export function MultiParserWithMedia(args: MultiParserWithMediaProps) {
  const { imagesMap } = useImageState();
  const mediaOrigin = useMediaOrigin()[0];
  const copyAction = useCallback((e: MouseEvent) => {
    const elm = e.target as HTMLElement;
    if (elm?.dataset.copy) CopyWithToast(elm.dataset.copy);
  }, []);
  const MultiParserReplace = useCallback(
    ({ linkPush, n }: MultiParserReplaceProps) => {
      if (imagesMap && linkPush && n.type === "tag" && n.name === "img") {
        let src = n.attribs.src;
        const Url = new URL(location.href);
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
            const src = imageItem.src;
            n.attribs.src = src ? concatOriginUrl(mediaOrigin, src) : "";
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
      if (
        n.type === "tag" &&
        n.name === "a" &&
        n.attribs.href.startsWith("copy:")
      ) {
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
      return n;
    },
    [imagesMap]
  );
  return MultiParser({
    ...args,
    replaceFunction: MultiParserReplace,
    preventScrollResetSearches: ["fc-event-id"],
  });
}
