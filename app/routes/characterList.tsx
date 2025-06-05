import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/characterList";
import { SetMetaDefault } from "~/components/SetMeta";
import type { SetRootMetaProps } from "~/data/rootData";
import { charactersDataIndexed, waitIdb } from "~/data/ClientDBLoader";
import { CharacterPage, CharaDetail } from "~/page/CharacterPage";
import { envAsync } from "~/data/ClientEnvLorder";

export async function loader({ context }: Route.LoaderArgs) {
  return { env: getCfEnv({ context }) };
}
export async function clientLoader({}: Route.ClientLoaderArgs) {
  await waitIdb;
  return { env: await envAsync } as SetRootMetaProps;
}
clientLoader.hydrate = true;

interface MetaWithDataArgs extends Route.MetaArgs {
  data: SetRootMetaProps;
}
export function meta({ data }: MetaWithDataArgs) {
  let title = "キャラクター";
  return SetMetaDefault({ env: data?.env, title });
}

export default function CharacterList({
  loaderData,
  params,
}: Route.ComponentProps) {
  return <CharacterPage />;
}
