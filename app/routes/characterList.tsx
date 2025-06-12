import type { Route } from "./+types/characterList";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { CharacterPage } from "~/page/CharacterPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "キャラクター",
    description: "わたかぜコウのキャラクターリスト",
  });
}

export default function CharacterList({}: Route.ComponentProps) {
  return <CharacterPage />;
}
