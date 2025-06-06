import { CharacterPage, CharaDetail } from "~/page/CharacterPage";
import type { Route } from "./+types/character";
import { charactersDataIndexed, waitIdb } from "~/data/ClientDBLoader";
import { SetMetaDefault } from "~/components/SetMeta";
import type { SetRootProps } from "~/data/rootData";
import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import { envAsync } from "~/data/ClientEnvLorder";
import { useEnv } from "~/components/state/EnvState";

interface SetMetaProps extends SetRootProps {
  character?: CharacterDataType | CharacterType;
}
interface MetaArgs extends Route.MetaArgs {
  data: SetMetaProps;
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const db = getCfDB({ context });
  const character = await db
    ?.select<CharacterDataType>({
      table: "characters",
      where: { key: params.charaName },
    })
    .then((c) => c[0]);
  return {
    env: getCfEnv({ context }),
    character,
  } as SetMetaProps;
}

let clientServerData: SetMetaProps | null = null;
export async function clientLoader({
  request,
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  await waitIdb;
  if (clientServerData?.character?.name !== params.charaName) {
    clientServerData = {
      env: await envAsync,
      character: await charactersDataIndexed.table.get({
        index: "key",
        query: params.charaName,
      }),
    };
  }
  return clientServerData;
}
clientLoader.hydrate = true;

export function meta({ data }: MetaArgs) {
  let title = data.title || "キャラクター";
  let description = data.description;
  if (data.character) {
    const character = data.character;
    title = character.name + " - " + title;
    if (character.overview) description = character.overview;
  }
  return SetMetaDefault({ env: data?.env, title, description });
}

export default function Character({ params }: Route.ComponentProps) {
  return <CharacterPage charaName={params.charaName} />;
}
