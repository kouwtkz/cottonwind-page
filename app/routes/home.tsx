import type { Route } from "./+types/home";
import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";
import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import { TopPage } from "~/page/topPage";

export async function loader({ context }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  // const db = getCfDB({ context });
  //   const db = new MeeSqlD1(context.cloudflare.env.DB);
  //   const selected = await db.select<ImageDataType>({
  //     table: "images",
  //     where: { id: 12 },
  //   });
  //   console.log(selected);
  return { title: env.TITLE, description: env.DESCRIPTION };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <TopPage />;
}
