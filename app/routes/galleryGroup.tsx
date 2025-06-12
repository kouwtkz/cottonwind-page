import type { Route } from "./+types/galleryGroup";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { GalleryGroupPageRoot } from "~/page/GalleryPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";
import { ArrayEnv } from "~/Env";

export function meta({ matches, params }: Route.MetaArgs) {
  const metaData = { ...getDataFromMatches(matches)?.data };
  metaData.title = "ギャラリー";
  const gallery = ArrayEnv.IMAGE_ALBUMS?.find((v) => v.name === params.group);
  if (gallery) {
    const generate = gallery.gallery?.generate;
    metaData.title =
      (generate?.label ?? gallery.name).toUpperCase() + " - " + metaData.title;
    metaData.description = gallery.description ?? generate?.h4 ?? generate?.h2;
  }
  metaData.description =
    (metaData.description ? metaData.description + " - " : "") +
    "わたかぜコウやわたかぜっこの作品、イラストなどのページ";
  return SetMetaDefault(metaData);
}

export default function Page() {
  return <GalleryGroupPageRoot />;
}
