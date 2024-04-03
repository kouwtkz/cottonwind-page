import { memo } from "react";
import { CharaObjectType, CharaType } from "../../types/CharaType";
import { SiteDataType } from "../../types/SiteDataType";
import { MediaImageItemType } from "../../mediaScripts/GetImageList.mjs";
import { imageFindFromName } from "./images";

export interface SetMetaProps {
  site: SiteDataType;
  path: string;
  query?: QueryType;
  characters?: CharaObjectType | null;
  images?: MediaImageItemType[];
}

type MetaStrsReturnType = {
  title: string;
  description: string;
  image: string;
};
export function MetaStrs({
  path,
  query,
  site,
  characters,
  images,
}: SetMetaProps): MetaStrsReturnType {
  let title: string | undefined;
  let description: string | undefined;
  let image: string | undefined | null;
  const list = path.split("/");
  const queryParams = QueryToParams(query);
  switch (list[1]) {
    case "gallery":
      title = "ギャラリー | " + site.title;
      description = "わたかぜコウの作品など";
      break;
    case "character":
      const name = list[2] ?? queryParams?.name;
      const chara = characters && name ? characters[name] : null;
      title = chara
        ? chara.name + " - キャラクター | " + site.title
        : "キャラクター | " + site.title;
      description =
        chara?.overview || chara?.description || "わたかぜコウのキャラクター";
      if (images && chara?.image) {
        const charaImage = chara.image;
        image = images?.find(({ URL }) => URL?.match(charaImage))?.URL;
      }
      break;
    case "work":
      title = "かつどう | " + site.title;
      description = "わたかぜコウの活動";
      break;
    case "sound":
      title = "おんがく | " + site.title;
      description = "わたかぜコウが作った音楽";
      break;
    case "info":
      title = "じょうほう | " + site.title;
      description = "わたかぜコウやサイトの情報";
      break;
  }
  const imageParam = queryParams?.image;
  const albumParam = queryParams?.album;
  if (imageParam && albumParam) {
    const foundImage = imageFindFromName({
      imageParam,
      albumParam,
      imageItemList: images,
    });
    if (foundImage) {
      title = (foundImage.name || foundImage.src) + " - " + title;
      image = foundImage.URL;
    }
  }
  if (!title) title = site.title;
  if (!description) description = site.description;
  if (!image) image = site.image;
  return { title, description, image: site.url + image };
}

export function MetaTags({
  title,
  description,
  image,
  card = "summary_large_image",
}: {
  title: string;
  description: string;
  image: string;
  card: "summary_large_image";
}) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content={card} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}

type QueryType = string | { [k: string]: string };

export function QueryToParams(query?: QueryType) {
  return query
    ? typeof query === "string"
      ? Object.fromEntries(new URLSearchParams(query))
      : query
    : null;
}

export function SetMeta({ site, ...args }: SetMetaProps) {
  return (
    <MetaTags {...MetaStrs({ ...args, site })} card="summary_large_image" />
  );
}
