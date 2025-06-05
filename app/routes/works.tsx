import { getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/gallery";
import { waitIdb } from "~/data/ClientDBLoader";
import { envAsync } from "~/data/ClientEnvLorder";
import { SetMetaDefault, type SetRootMetaProps } from "~/components/SetMeta";
import WorksPage from "~/page/WorksPage";

export async function loader({ context }: Route.LoaderArgs) {
  return { env: getCfEnv({ context }) };
}
export async function clientLoader({}: Route.ClientLoaderArgs) {
  await waitIdb;
  return { env: await envAsync } as SetRootMetaProps;
}
clientLoader.hydrate = true;

interface MetaWithDataArgs extends Route.MetaArgs {
  data: SetRootMetaProps;
}
export function meta({ data }: MetaWithDataArgs) {
  let title = "おしごと";
  return SetMetaDefault({ env: data?.env, title });
}

export default function Page() {
  return <WorksPage/>;
}
