import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/charactersList";
import {
  SetMetaDefault,
  SetMetaTitle,
  type SetMetaProps,
} from "~/components/SetMeta";
import { charactersDataIndexed, waitIdb } from "~/data/ClientDBLoader";

export async function loader() {
}

export async function clientLoader({
  request,
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  await waitIdb;
  return await charactersDataIndexed.table.getAll();
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
