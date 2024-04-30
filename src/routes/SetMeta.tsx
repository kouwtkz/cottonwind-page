import { imageFindFromName } from "../data/functions/images";
import { WebSite, WithContext } from "schema-dts";
import { toUpperFirstCase } from "../components/doc/StrFunctions.mjs";
import {
  autoFixTagsOptions,
  defaultTags,
  getTagsOptions,
} from "@/components/tag/GalleryTags";

export interface SetMetaProps {
  site: SiteDataType;
  path: string;
  query?: QueryType;
  url?: string;
  characters?: CharaObjectType | null;
  images?: MediaImageItemType[];
}

type MetaValuesReturnType = {
  title: string;
  description: string;
  image: string;
  imageSize: { w: number; h: number };
};
export function MetaValues({
  path,
  query,
  site,
  characters,
  images,
}: SetMetaProps): MetaValuesReturnType {
  let title: string | undefined;
  let description: string | undefined;
  let image: string | undefined | null;
  let imageSize = { w: 1000, h: 1000 };
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
          const charaImageItem = images?.find(({ URL }) =>
            URL?.match(charaImage)
          );
          if (charaImageItem) {
            image = charaImageItem.URL;
            if (charaImageItem.size) {
              imageSize = {
                w: charaImageItem.size.w,
                h: charaImageItem.size.h,
              };
            }
          }
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
  if (imageParam) {
    const foundImage = imageFindFromName({
      imageParam,
      albumParam,
      imageItemList: images,
    });
    if (foundImage) {
      title = (foundImage.name || foundImage.src) + " - " + title;
      image = foundImage.URL;
      if (foundImage.size) {
        imageSize = {
          w: foundImage.size.w,
          h: foundImage.size.h,
        };
      }
      const charaListFound = characters
        ? (foundImage.tags ?? []).map((tag) => characters[tag]).filter((v) => v)
        : [];
      const charaList = charaListFound
        .slice(0, 2)
        .map((chara) => chara.name + (chara.honorific ?? ""));
      const tagsOptions = autoFixTagsOptions(getTagsOptions(defaultTags));
      const content = (foundImage.tags ?? []).find((tag) =>
        tagsOptions.some(({ value }) => value === tag)
      );
      let picDescription =
        charaList.length > 0
          ? charaList.join("と") + (charaListFound.length > 2 ? "など" : "")
          : "";
      if (content) {
        picDescription =
          picDescription +
          (picDescription ? "の" : "") +
          tagsOptions.find(({ value }) => value === content)!.label;
      }
      if (picDescription) {
        switch (foundImage.type?.toLocaleLowerCase()) {
          case "illust":
            picDescription = picDescription + "のイラスト";
            break;
          case "picture":
            picDescription = picDescription + "の写真";
            break;
          case "goods":
            picDescription = picDescription + "のグッズ";
            break;
          case "3d":
            picDescription = picDescription + "の3Dモデル";
            break;
          case "given":
            picDescription = picDescription + "のファンアート";
            break;
          default:
            picDescription = picDescription + "の画像";
            break;
        }
      }
      if (foundImage.description)
        picDescription = picDescription
          ? foundImage.description + "\n(" + picDescription + ")"
          : foundImage.description;
      description = picDescription ? picDescription : title + "の画像詳細";
    }
  }
  if (!title) title = site.title;
  if (!description) description = site.description;
  if (!image) image = site.image;
  return { title, description, image: site.url + image, imageSize };
}

interface MetaTagsProps extends SetMetaProps {
  title: string;
  description: string;
  image: string;
  imageSize: { w: number; h: number };
  card: "summary_large_image";
}
export function MetaTags({
  title,
  description,
  image,
  imageSize,
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
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={String(imageSize.w)} />
      <meta property="og:image:height" content={String(imageSize.h)} />
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
      {...MetaValues({ ...args, site: args.site })}
      card="summary_large_image"
      {...args}
    />
  );
}
