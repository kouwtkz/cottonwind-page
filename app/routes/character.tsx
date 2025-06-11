import { CharacterPage } from "~/page/CharacterPage";
import type { Route } from "./+types/character";
import { charactersDataIndexed, waitIdb } from "~/data/ClientDBLoader";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { getCfDB } from "~/data/cf/getEnv";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export async function loader({ context, params }: Route.LoaderArgs) {
  const db = getCfDB({ context });
  const character = await db
    ?.select<CharacterDataType>({
      table: "characters",
      where: { key: params.charaName },
    })
    .then((c) => c[0]);
  return character;
}

let clientServerData: CharacterDataType | null = null;
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  await waitIdb;
  if (clientServerData?.name !== params.charaName) {
    clientServerData = await charactersDataIndexed.table
      .get({
        index: "key",
        query: params.charaName,
      })
      .then((v) => v?.rawdata || null);
  }
  return clientServerData;
}
clientLoader.hydrate = true;

export function meta({ data: character, matches }: Route.MetaArgs) {
  let title = "キャラクター";
  let description: string | undefined;
  if (character) {
    title = character.name + " - " + title;
    if (character.overview) description = character.overview;
  }
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title,
    description,
  });
}

export default function Character({ params }: Route.ComponentProps) {
  return <CharacterPage charaName={params.charaName} />;
}
