import { useImageState } from "@/state/ImageState";
import { GetImageItemFromSrc } from "@/layout/ImageMee";
import { useMediaOrigin } from "@/state/EnvState";
import {
  MultiParser,
  MultiParserProps,
  MultiParserReplaceProps,
} from "./MultiParser";
import {
  ChildNode,
  Element as NodeElement,
  Text as NodeText,
} from "domhandler";

interface MultiParserWithMediaProps
  extends Omit<MultiParserProps, "replaceFunctions"> {}

export function MultiParserWithMedia(args: MultiParserWithMediaProps) {
  const { images } = useImageState();
  const mediaOrigin = useMediaOrigin()[0];
  function MultiParserReplaceImages({ linkPush, n }: MultiParserReplaceProps) {
    if (images && linkPush && n.type === "tag" && n.name === "img") {
      let src = n.attribs.src;
      let Url = new URL(src, location.href);
      let pagenameFlag =
        location.host === Url.host && location.pathname === Url.pathname;
      if (pagenameFlag && !/^\w+:\/\//.test(src)) {
        if (!images) n.attribs.src = "";
        else {
          const imageItem = images
            ? GetImageItemFromSrc({
                src: { query: Object.fromEntries(Url.searchParams) },
                list: images,
              })
            : null;
          if (imageItem) {
            const src = imageItem.src;
            n.attribs.src = src ? mediaOrigin + src : "";
            n.attribs.title = n.attribs.alt || imageItem.name || "";
            n.attribs.alt = n.attribs.title;
            Url.searchParams.delete("pic");
            Url.searchParams.set("image", imageItem.key);
          }
        }
        return new NodeElement("a", { href: Url.href }, [n]);
      }
    }
    return n;
  }
  return MultiParser({
    ...args,
    replaceFunctions: MultiParserReplaceImages.bind(images),
  });
}
