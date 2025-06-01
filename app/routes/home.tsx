import type { Route } from "./+types/home";
import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";
import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import { TopPage } from "~/page/topPage";

export default function Home({ loaderData }: Route.ComponentProps) {
  return <TopPage />;
}
