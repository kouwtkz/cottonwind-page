import { WebSite, WithContext } from "schema-dts";
import { toUpperFirstCase } from "../functions/doc/StrFunctions";
import {
  autoFixGalleryTagsOptions,
  defaultGalleryTags,
  getTagsOptions,
} from "../components/dropdown/SortFilterTags";
import { RoutingUnion } from "../routes/RoutingList";
import { parse } from "marked";
import { concatOriginUrl } from "@/functions/originUrl";

export interface SetMetaProps {
  path: string;
  query?: QueryType;
  url?: string;
  charactersMap?: Map<string, CharacterType>;
  imagesMap?: Map<string, ImageType>;
  posts?: PostType[];
  noindex?: boolean;
  mediaOrigin?: string;
  env?: SiteConfigEnv;
}

type MetaValuesReturnType = {
  title: string;
  description: string;
  image?: string | null;
  imageSize?: { w: number; h: number };
  noindex?: boolean;
};
export function MetaValues({
  path,
  query,
  charactersMap,
  imagesMap,
  posts,
  noindex,
  mediaOrigin,
  env,
}: SetMetaProps): MetaValuesReturnType {
  const siteTitle = env?.TITLE;
  let title: string | undefined;
  let description: string | undefined;
  let image: string | undefined | null;
  let imageSize = { w: 1000, h: 1000 };
  const list = path.split("/");
  const queryParams = QueryToParams(query) ?? {};
  if (queryParams.invite) {
    title = `招待 - ${toUpperFirstCase(queryParams.invite)} | ${siteTitle}`;
    description = "Discordへの招待ページ（合言葉式）";
  }
  if (!title)
    switch (list[1] as RoutingUnion) {
      case "gallery":
        title = "ギャラリー | " + siteTitle;
        const group = list[2];
        if (group) {
          const gallery = env?.IMAGE_ALBUMS?.find((v) => v.name === group);
          if (gallery) {
            const generate = gallery.gallery?.generate;
            title =
              (generate?.label ?? gallery.name).toUpperCase() + " - " + title;
            description = gallery.description ?? generate?.h4 ?? generate?.h2;
          }
        }
        description =
          (description ? description + " - " : "") +
          "わたかぜコウやわたかぜっこの作品、イラストなどのページ";
        break;
      case "character":
        const name = list[2] ?? queryParams.name;
        const chara = charactersMap && name ? charactersMap.get(name) : null;
        title = chara
          ? chara.name + " - キャラクター | " + siteTitle
          : "キャラクター | " + siteTitle;
        description =
          chara?.overview || chara?.description || "わたかぜコウのキャラクター";
        if (chara?.media?.image) {
          if (chara.media.image) {
            image = concatOriginUrl(mediaOrigin, chara.media.image.src);
            if (chara.media.image.width && chara.media.image.height) {
              imageSize = {
                w: chara.media.image.width,
                h: chara.media.image.height,
              };
            }
          }
        }
        break;
      case "links":
        title = "リンク | " + siteTitle;
        description = "わたかぜコウのリンクページ";
        break;
      case "works":
        title = "おしごと | " + siteTitle;
        description = "わたかぜコウのおしごとページ";
        break;
      case "sound":
        title = "おんがく | " + siteTitle;
        description = "わたかぜコウが作った音楽";
        break;
      case "about":
        title = "じょうほう | " + siteTitle;
        description = "わたかぜコウやサイトの情報";
        break;
      case "blog":
        noindex = true;
        title = "ブログ | " + siteTitle;
        const postId = queryParams.postId;
        const postItem = posts?.find((item) => item.postId === postId);
        if (postItem) {
          title = postItem.title + " - " + title;
          const parsed = String(parse(postItem.body || "", { async: false }))
            .replace(/\<.+\>/g, "")
            .replace(/\s+/g, " ");
          let sliced = parsed.slice(0, 300);
          if (parsed.length > sliced.length) sliced = sliced + "…";
          description = sliced;
        } else {
          description = "わたかぜコウのサイト内ブログ";
        }
        break;
      case "admin":
        title = "かんりしつ | " + siteTitle;
        switch (list[2]) {
          case "images":
            title = "がぞうかんり - " + title;
            break;
          case "files":
            title = "ファイルかんり - " + title;
            break;
        }
        description = "サイトの管理";
        break;
      case "suggest":
        title = "ていあん | " + siteTitle;
        description = "打ち間違いなど用の誘導";
        break;
    }
  if (queryParams.p) noindex = true;
  const imageParam = queryParams.image;
  if (imageParam) noindex = true;
  if (imageParam) {
    const foundImage = imagesMap?.get(imageParam);
    if (foundImage) {
      title = (foundImage.name || foundImage.key) + " | " + title;
      image = concatOriginUrl(mediaOrigin, foundImage.src);
      if (foundImage.width && foundImage.height) {
        imageSize = {
          w: foundImage.width,
          h: foundImage.height,
        };
      }
      const charaListFound = charactersMap
        ? ((foundImage.tags ?? [])
            .map((tag) => charactersMap.get(tag))
            .filter((v) => v) as CharacterType[])
        : [];
      const charaList = charaListFound
        .slice(0, 2)
        .map((chara) => chara.name + (chara.honorific ?? ""));
      const tagsOptions = autoFixGalleryTagsOptions(
        getTagsOptions(defaultGalleryTags)
      );
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
  if (!title) title = siteTitle + " - " + env?.OVERVIEW;
  if (!description) description = env?.DESCRIPTION ?? "";
  if (!image && env?.SITE_IMAGE && imagesMap?.has(env.SITE_IMAGE)) {
    const imageItem = imagesMap.get(env.SITE_IMAGE)!;
    image = concatOriginUrl(mediaOrigin, imageItem.src);
  }
  return {
    title,
    description,
    image,
    imageSize,
    noindex,
  };
}

interface MetaTagsProps extends SetMetaProps {
  title: string;
  description: string;
  image?: string | null;
  imageSize?: { w: number; h: number };
  card: "summary_large_image";
}
export function MetaTags({
  title,
  description,
  image,
  imageSize,
  url,
  card = "summary_large_image",
  path,
  noindex,
  env,
}: MetaTagsProps) {
  let jsonLd: WithContext<WebSite> | undefined;
  switch (path) {
    case "/":
      jsonLd = {
        "@type": "WebSite",
        "@context": "https://schema.org",
        url: url || env?.ORIGIN,
        name: env?.TITLE,
        alternateName: env?.ALTERNATE?.split(","),
      };
      break;
  }
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={env?.TITLE} />
      <meta property="og:type" content="website" />
      <meta property="og:keywords" content={env?.ALTERNATE} />
      {image ? (
        <>
          <meta property="og:image" content={image} />
          {imageSize ? (
            <>
              <meta property="og:image:width" content={String(imageSize.w)} />
              <meta property="og:image:height" content={String(imageSize.h)} />
            </>
          ) : null}
        </>
      ) : null}
      <meta name="twitter:card" content={card} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}
      {noindex ? <meta name="robots" content="noindex" /> : null}
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </>
  );
}

type QueryType = string | { [k: string]: string | undefined };

export function QueryToParams(query?: QueryType) {
  return query
    ? typeof query === "string"
      ? Object.fromEntries(new URLSearchParams(query))
      : query
    : null;
}

export function SetMeta(args: SetMetaProps) {
  return (
    <MetaTags {...args} {...MetaValues(args)} card="summary_large_image" />
  );
}
