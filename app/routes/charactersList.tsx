import type { Route } from "./+types/charactersList";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: "キャラクターページ" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  // console.log({ context });
  console.log({ mee: globalThis.globalEnv });
  if (context.cloudflare) {
    // console.log(context.cloudflare.env);
  }
  //   const db = new MeeSqlD1(context.cloudflare.env.DB);
  //   const selected = await db.select<ImageDataType>({
  //     table: "images",
  //     where: { id: 12 },
  //   });
  //   console.log(selected);
  return { mee: "meemee" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <main>めぇめぇ</main>;
}
