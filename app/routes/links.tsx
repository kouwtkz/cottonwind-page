import type { Route } from "./+types/links";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import LinksPage from "~/page/LinksPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "リンク",
    description: "わたかぜコウのリンクページ",
  });
}

export default function Page() {
  return <LinksPage />;
}
