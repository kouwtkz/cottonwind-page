import { useAtom } from "jotai";
import { imagesAtom } from "@/state/ImageState";
import { GetImageItemFromSrc } from "@/layout/ImageMee";
import { MediaOriginAtom } from "@/state/EnvState";
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
  const images = useAtom(imagesAtom)[0];
  const mediaOrigin = useAtom(MediaOriginAtom)[0];
  // function MultiParserReplaceImages({ linkPush, n }: MultiParserReplaceProps) {
  //   if (images && linkPush && n.type === "tag" && n.name === "img") {
  //     let src = n.attribs.src;
  //     let Url = new URL(src, location.href);
  //     let pagenameFlag =
  //       location.host === Url.host && location.pathname === Url.pathname;
  //     if (pagenameFlag && !/^\w+:\/\//.test(src)) {
  //       if (!images) n.attribs.src = "";
  //       else {
  //         const imageItem = images
  //           ? GetImageItemFromSrc({
  //               src: { query: Object.fromEntries(Url.searchParams) },
  //               list: images,
  //             })
  //           : null;
  //         if (imageItem) {
  //           const src = imageItem.webp || imageItem.src;
  //           n.attribs.src = src ? apiOrigin + src : "";
  //           n.attribs.title = n.attribs.alt || imageItem.name || "";
  //           n.attribs.alt = n.attribs.title;
  //           Url.searchParams.delete("pic");
  //           Url.searchParams.set("image"). = toSearch.image;
  //         }
  //       }
  //       const hrefUrl = new URL(location.search, location.href);
  //       return new NodeElement(
  //         "a",
  //         {
  //           href: MakeURL({
  //             query: {
  //               ...Object.fromEntries(new URLSearchParams(location.search)),
  //               ...params,
  //             },
  //           }).search,
  //         },
  //         [n]
  //       );
  //     }
  //   }
  //   return n;
  // }
  return MultiParser({
    ...args,
    // replaceFunctions: MultiParserReplaceImages.bind(imageObject),
  });
}
