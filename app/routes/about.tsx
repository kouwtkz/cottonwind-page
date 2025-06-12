import type { Route } from "./+types/about";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import AboutPage from "~/page/AboutPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "じょうほう",
    description: "わたかぜコウやサイトの情報",
  });
}

export default function Page() {
  return <AboutPage />;
}
