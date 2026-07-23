import type { Route } from "./+types/works";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { WorksPage } from "~/page/WorksPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "おしごと",
    description: import.meta.env.VITE_OWNER + "のおしごとページ",
  });
}

export default function Page() {
  return <WorksPage />;
}
