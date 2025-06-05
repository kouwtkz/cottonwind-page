import type { Route } from "./+types/home";
import Home from "~/page/Home";
import { waitIdb } from "~/data/ClientDBLoader";
import { envAsync } from "~/data/ClientEnvLorder";
import type { OmittedEnv } from "types/custom-configuration";

type loaderDataType = { env: Partial<OmittedEnv> } | undefined;
export async function loader() {}
export async function clientLoader({}: Route.ClientLoaderArgs) {
  await waitIdb;
  return { env: await envAsync } as loaderDataType;
}
clientLoader.hydrate = true;

export default function Page({ loaderData }: Route.ComponentProps) {
  return <Home env={loaderData?.env} />;
}
