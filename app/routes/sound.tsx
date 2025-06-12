import type { Route } from "./+types/sound";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { SoundPage } from "~/page/SoundPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "おんがく",
    description: "わたかぜコウが作った音楽",
  });
}

export default function Page() {
  return <SoundPage />;
}
