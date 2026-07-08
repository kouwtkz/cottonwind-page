import { getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/gallery";
import { waitIdb } from "~/data/ClientDBLoader";
import { envAsync } from "~/data/ClientEnvLorder";
import { SetMetaDefault, type SetRootProps } from "~/components/utils/SetMeta";
import { GalleryPage } from "~/page/GalleryPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "ギャラリー",
    description: "わたかぜコウやわたかぜっこの作品、イラストなどのページ",
  });
}

export default function Page() {
  return <GalleryPage />;
}
