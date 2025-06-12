import type { Route } from "./+types/adminGroup";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { AdminPage } from "~/page/AdminPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches, params }: Route.MetaArgs) {
  const metaData = { ...getDataFromMatches(matches)?.data };
  metaData.title = "かんりしつ";
  switch (params.key) {
    case "images":
      metaData.title = "がぞうかんり - " + metaData.title;
      break;
    case "files":
      metaData.title = "ファイルかんり - " + metaData.title;
      break;
  }
  metaData.description = "サイトの管理";
  return SetMetaDefault(metaData);
}

export default function Page() {
  return <AdminPage />;
}
