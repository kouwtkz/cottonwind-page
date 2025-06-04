import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/charactersList";
import { SetMetaTitle } from "~/components/SetMeta";
import { charactersDataIndexed } from "~/data/ClientDBLoader";

export async function clientLoader({
  request,
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  return await charactersDataIndexed?.table.getAll();
}
clientLoader.hydrate = true;

export default function CharactersList({ loaderData }: Route.ComponentProps) {
  console.log(loaderData);
  return (
    <>
      <h1>Character page !</h1>
      <div>
        {/* {loaderData.list?.map((character, i) => (
          <div key={i}>{character.name}</div>
        ))} */}
      </div>
    </>
  );
}
