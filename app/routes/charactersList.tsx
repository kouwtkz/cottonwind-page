import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/charactersList";
import { SetLoaderEnv, SetMetaTitle } from "~/components/SetMeta";

export function meta({ data }: Route.MetaArgs) {
  return [SetMetaTitle({ title: "キャラクターページ", data })];
}

export async function loader({ context }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  const db = getCfDB({ context });
  const list = await db?.select<CharacterDataType>({
    table: "characters",
  });
  return { list, ...SetLoaderEnv(env) };
}

export default function CharactersList({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>Character page !</h1>
      <div>
        {loaderData.list?.map((character, i) => (
          <div key={i}>{character.name}</div>
        ))}
      </div>
    </>
  );
}
