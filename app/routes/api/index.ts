import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types";

export async function loader({ context }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  const db = getCfDB({ context });
  const images = await db?.select({ table: "images" });
  const characters = await db?.select({ table: "characters" });
  return { images, characters };
}

export function action() {
  return new Response("");
}