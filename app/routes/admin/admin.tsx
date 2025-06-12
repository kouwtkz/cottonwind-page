import type { Route } from "./+types/admin";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { AdminPage } from "~/page/AdminPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "かんりしつ",
    description: "サイトの管理",
  });
}

export default function Page() {
  return <AdminPage />;
}
