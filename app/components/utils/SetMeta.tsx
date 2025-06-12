import type { OmittedEnv } from "types/custom-configuration";
import { concatOriginUrl } from "../functions/originUrl";
import type { Location } from "react-router";
import {
  autoFixGalleryTagsOptions,
  defaultGalleryTags,
  getTagsOptions,
} from "../dropdown/SortFilterTags";

export type MetaValuesType =
  | { title: string }
  | { name: string; content: string };

export interface SetRootProps {
  Url?: URL;
  env?: Partial<OmittedEnv>;
  title?: string;
  description?: string;
  image?: ImageDataType | string | null;
  charaList?: (CharacterDataType | string)[];
  apiOrigin?: string;
  mediaOrigin?: string;
  noIndex?: boolean;
  isLogin?: boolean;
  isBot?: boolean;
  card?: "summary" | "summary_large_image" | "app" | "player";
  root?: SetRootProps;
  location?: Location<any>;
}

interface rootClientServerDataType {
  data: SetRootProps | null;
}
export const rootClientServerData: rootClientServerDataType = { data: null };

interface getMetaFromImageResult {
  title?: string;
  description?: string;
}
let globalImageMetaCache: {
  key: string;
  value: getMetaFromImageResult;
} | null = null;
function getMetaFromImage({
  image,
  charaList = [],
}: {
  image?: ImageDataType | string | null;
  charaList?: (CharacterDataType | string)[];
}): getMetaFromImageResult {
  if (image && typeof image === "object") {
    if (image.key === globalImageMetaCache?.key) {
      return globalImageMetaCache.value;
    }
    const title = image.title || image.key;
    const tagsOptions = autoFixGalleryTagsOptions(
      getTagsOptions(defaultGalleryTags)
    );
    const content = (image.tags || "")
      .split(",")
      .find((tag) => tagsOptions.some(({ value }) => value === tag));
    let description =
      charaList.length > 0
        ? charaList
            .filter((v) => typeof v !== "string")
            .map((v) => (v.name || v.key) + (v.honorific || ""))
            .join("と") + (charaList.length > 2 ? "など" : "")
        : "";
    if (content) {
      description =
        description +
        (description ? "の" : "") +
        tagsOptions.find(({ value }) => value === content)!.label;
    }
    if (description) {
      switch (image.type?.toLocaleLowerCase()) {
        case "illust":
          description = description + "のイラスト";
          break;
        case "picture":
          description = description + "の写真";
          break;
        case "goods":
          description = description + "のグッズ";
          break;
        case "3d":
          description = description + "の3Dモデル";
          break;
        case "given":
          description = description + "のファンアート";
          break;
        default:
          description = description + "の画像";
          break;
      }
    }
    if (image.description)
      description = description
        ? image.description + "\n(" + description + ")"
        : image.description;
    const value: getMetaFromImageResult = {
      title,
      description: description ? description : title + "の画像詳細",
    };
    globalImageMetaCache = { key: image.key, value };
    return value;
  } else return {};
}

export function SetMetaDefault({
  Url,
  title,
  description,
  env,
  mediaOrigin,
  image: argImage,
  charaList,
  root,
  noIndex,
  card = "summary_large_image",
  location,
}: SetRootProps = {}): MetaValuesType[] {
  const searchParams = location
    ? new URLSearchParams(location.search)
    : Url?.searchParams || null;
  const list: MetaValuesType[] = [];
  let imagePath: string | undefined;
  let imageSize: { w: number; h: number } | undefined;
  let image: string | ImageDataType | null | undefined;
  if (searchParams?.has("image")) {
    image = root?.image || argImage;
    const imageMeta = getMetaFromImage({ charaList, image });
    if (imageMeta.title) title = concatTitle(imageMeta.title, title, "-");
    if (imageMeta.description) description = imageMeta.description;
  } else {
    image = argImage;
  }
  SetMetaTitle({ title, env }).forEach((v) => {
    list.push(v);
  });
  description = description || env?.DESCRIPTION;
  if (description) list.push({ name: "description", content: description });
  if (image) {
    if (typeof image === "string") {
      imagePath = image;
    } else {
      imagePath = concatOriginUrl(mediaOrigin, image.src);
      if (image.width && image.height) {
        imageSize = { w: image.width, h: image.height };
      }
    }
  }
  if (imagePath) {
    list.push({ name: "og:image", content: imagePath });
    list.push({ name: "twitter:image", content: imagePath });
    if (imageSize) {
      list.push({ name: "og:image:width", content: String(imageSize.w) });
      list.push({ name: "og:image:height", content: String(imageSize.h) });
    }
  }
  if (env?.TITLE) list.push({ name: "og:site_name", content: env.TITLE });
  list.push({ name: "og:type", content: "website" });
  if (env?.ALTERNATE)
    list.push({ name: "og:keywords", content: env.ALTERNATE });
  if (Url) list.push({ name: "og:url", content: Url.href });
  if (card) list.push({ name: "twitter:card", content: card });
  if (noIndex) list.push({ name: "robots", content: "noindex" });
  return list;
}

interface addSiteTitleProps extends SetRootProps {
  title?: string;
}
export function concatTitle(left?: string, right?: string, separator = "|") {
  return left && right ? left + ` ${separator} ` + right : left || right || "";
}
export function addSiteTitle({ title = "", env }: addSiteTitleProps) {
  return concatTitle(title, env?.TITLE);
}
export function SetMetaTitle(props: addSiteTitleProps) {
  const list: MetaValuesType[] = [];
  const title = addSiteTitle(props);
  if (title) {
    list.push({ title });
    list.push({ name: "og:title", content: title });
    list.push({ name: "twitter:title", content: title });
  }
  return list;
}
