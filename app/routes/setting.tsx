import type { Route } from "./+types/setting";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { SettingPage } from "~/page/Setting";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "せってい",
  });
}

export default function Page() {
  return <SettingPage />;
}
