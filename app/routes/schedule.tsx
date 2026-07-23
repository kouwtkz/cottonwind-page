import type { Route } from "./+types/schedule";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { SchedulePage } from "~/page/SchedulePage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "スケジュール",
    description: import.meta.env.VITE_OWNER + "のスケジュールページ",
  });
}

export default function Page() {
  return <SchedulePage />;
}
