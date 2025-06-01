import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";
import { getCfDB, getCfEnv } from "~/data/cf/getEnv";

export function meta({ data }: Route.MetaArgs) {
  console.log("ほーむ");
  return [
    { title: "test" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  const db = getCfDB({ context });
  //   const db = new MeeSqlD1(context.cloudflare.env.DB);
  //   const selected = await db.select<ImageDataType>({
  //     table: "images",
  //     where: { id: 12 },
  //   });
  //   console.log(selected);
  return { mee: "meemee" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={"test"} />;
}
