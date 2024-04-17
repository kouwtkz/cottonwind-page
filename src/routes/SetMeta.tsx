import { CharaObjectType, CharaType } from "../types/CharaType";
import { SiteDataType } from "../types/ConfigSiteType";
import { MediaImageItemType } from "../mediaScripts/GetImageList.mjs";
import { imageFindFromName } from "../data/functions/images";
import { WebSite, WithContext } from "schema-dts";
import { toUpperFirstCase } from "../components/doc/StrFunctions.mjs";

export interface SetMetaProps {
  site: SiteDataType;
  path: string;
  query?: QueryType;
  url?: string;
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
  if (queryParams?.invite) {
    title = `招待 - ${toUpperFirstCase(queryParams.invite)} | ${site.title}`;
    description = "Discordへの招待ページ（合言葉式）";
  }
  if (!title)
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
      case "suggest":
        title = "ていあん | " + site.title;
        description = "打ち間違いなど用の誘導";
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

interface MetaTagsProps extends SetMetaProps {
  title: string;
  description: string;
  image: string;
  card: "summary_large_image";
}
export function MetaTags({
  title,
  description,
  image,
  url,
  card = "summary_large_image",
  site,
}: MetaTagsProps) {
  const jsonLd: WithContext<WebSite> = {
    "@type": "WebSite",
    "@context": "https://schema.org",
    url: url || site.url,
    name: title || site.title,
    alternateName: site.author.name,
  };
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

export function SetMeta(args: SetMetaProps) {
  return (
    <MetaTags
      {...MetaStrs({ ...args, site: args.site })}
      card="summary_large_image"
      {...args}
    />
  );
}
