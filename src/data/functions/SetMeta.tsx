import { memo } from "react";
import { CharaObjectType } from "../../types/CharaType";
import { SiteDataType } from "../../types/SiteDataType";

export interface SetMetaBaseProps {
  path: string;
  query?: QueryType;
  characters?: CharaObjectType | null;
}

export interface SetMetaProps extends SetMetaBaseProps {
  site: SiteDataType;
  characters?: CharaObjectType | null;
}

export function SetTitleStr({ path, query, site, characters }: SetMetaProps) {
  const list = path.split("/");
  const queryParams = QueryToParams(query);
  switch (list[1]) {
    case "gallery":
      return "ギャラリー | " + site.title;
    case "character":
      const name = list[2] ?? queryParams?.name;
      const chara = characters && name ? characters[name] : null;
      if (chara) return chara.name + " - キャラクター | " + site.title;
      else return "キャラクター | " + site.title;
    case "work":
      return "かつどう | " + site.title;
    case "sound":
      return "おんがく | " + site.title;
    case "info":
      return "じょうほう | " + site.title;
    default:
      return site.title;
  }
}

export function SetDescriptionStr({
  path,
  query,
  site,
  characters,
}: SetMetaProps) {
  const list = path.split("/");
  const queryParams = QueryToParams(query);
  switch (list[1]) {
    case "gallery":
      return "わたかぜコウの作品など";
    case "character":
      const name = list[2] ?? queryParams?.name;
      const chara = characters && name ? characters[name] : null;
      return (
        chara?.overview || chara?.description || "わたかぜコウのキャラクター"
      );
    case "work":
      return "わたかぜコウの活動";
    case "sound":
      return "わたかぜコウが作った音楽";
    case "info":
      return "わたかぜコウやサイトの情報";
    default:
      return site.description;
  }
}

export function MetaTags({
  title,
  description,
  image,
  baseUrl,
  card = "summary_large_image",
}: {
  title: string;
  description: string;
  image: string;
  baseUrl: string;
  card: "summary_large_image";
}) {
  const imageUrl = baseUrl + image;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content={card} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
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
    <MetaTags
      title={SetTitleStr({ ...args, site }) || site.title}
      description={SetDescriptionStr({ ...args, site }) || site.description}
      image={site.image}
      baseUrl={site.url}
      card="summary_large_image"
    />
  );
}
