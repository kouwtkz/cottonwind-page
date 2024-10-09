import { useImageState } from "@/state/ImageState";
import { useMediaOrigin } from "@/state/EnvState";
import {
  MultiParser,
  MultiParserProps,
  MultiParserReplaceProps,
} from "./MultiParser";
import { Element as NodeElement } from "domhandler";
import { concatOriginUrl } from "@/functions/originUrl";

interface MultiParserWithMediaProps
  extends Omit<MultiParserProps, "replaceFunctions"> {}

export function MultiParserWithMedia(args: MultiParserWithMediaProps) {
  const { imagesMap } = useImageState();
  const mediaOrigin = useMediaOrigin()[0];
  function MultiParserReplaceImages({ linkPush, n }: MultiParserReplaceProps) {
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
          n.attribs.title = n.attribs.alt || imageItem.name || "";
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
    return n;
  }
  return MultiParser({
    ...args,
    replaceFunctions: MultiParserReplaceImages.bind(imagesMap),
  });
}
