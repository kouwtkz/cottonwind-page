import { buildAddVer } from "../data/env";
import {
  getCopyRightList,
  getTagList,
  parseImageItems,
} from "../data/functions/images";
import { Element as NodeElement } from "domhandler";
import { GetUrlFlag, MakeURL } from "@/functions/doc/MakeURL";
import { GetImageItemFromSrc } from "@/layout/ImageMee";
import { MultiParserReplaceProps } from "@/functions/doc/MultiParser";
const defaultUrl = "/json/images.json" + buildAddVer;

export class ImageClass {
  imageItemList: Array<MediaImageItemType> = [];
  imageAlbumList: Array<MediaImageAlbumType> = [];
  tagList: ValueCountType[] = [];
  copyrightList: ValueCountType[] = [];
  isSet: boolean = false;
  test(x?: any) {
    console.log(this);
  }
  setImageAlbum(data: Array<MediaImageAlbumType>) {
    this.imageAlbumList = data;
    this.imageItemList = parseImageItems(data);
    this.tagList = getTagList(this.imageItemList);
    this.copyrightList = getCopyRightList(this.imageItemList);
    this.isSet = true;
  }
  async setImageFromUrl(url = defaultUrl) {
    return fetch(url).then(r => r.json()).then((d) => {
      this.setImageAlbum(d as any);
    });
  }
  MultiParserReplaceImages({ linkPush, n }: MultiParserReplaceProps) {
    if (this && linkPush && n.type === "tag" && n.name === "img") {
      let src = n.attribs.src;
      let Url = new URL(src, location.href);
      let params: { [k: string]: any } = {};
      let { pathname: pagenameFlag } = GetUrlFlag(Url);
      if (pagenameFlag && !/^\w+:\/\//.test(src)) {
        if (!this.isSet) n.attribs.src = "";
        else {
          const toSearch = Object.fromEntries(Url.searchParams);
          const imageItem = this.isSet
            ? GetImageItemFromSrc({
              src: { query: toSearch },
              list: this.imageItemList,
            })
            : null;
          if (imageItem) {
            n.attribs.src = imageItem.URL || "";
            n.attribs.title = n.attribs.alt || imageItem.name;
            n.attribs.alt = n.attribs.title;
            if ("pic" in toSearch) params.pic = "";
            params.image = toSearch.image;
          }
        }
        return new NodeElement(
          "a",
          {
            href: MakeURL({
              query: {
                ...Object.fromEntries(new URLSearchParams(location.search)),
                ...params,
              },
            }).search,
          },
          [n]
        )
      }
    }
    return n;
  }
}
