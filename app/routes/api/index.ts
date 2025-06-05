import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types";
import { getCookie, getCookieObject } from "~/components/utils/Cookie";

export async function loader({ context, request }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  console.log(getCookie({ request, key: "mee" }));
  const db = getCfDB({ context });
  const images = await db?.select({ table: "images" });
  const characters = await db?.select({ table: "characters" });
  return { images, characters };
}

export function action() {
  return new Response("");
}
