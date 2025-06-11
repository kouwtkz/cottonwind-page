import { getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/schedule";
import { waitIdb } from "~/data/ClientDBLoader";
import { envAsync } from "~/data/ClientEnvLorder";
import { SetMetaDefault, type SetRootProps } from "~/components/utils/SetMeta";
import { SchedulePage } from "~/page/SchedulePage";

export async function loader({ context }: Route.LoaderArgs) {
  return { env: getCfEnv({ context }) };
}
export async function clientLoader({}: Route.ClientLoaderArgs) {
  await waitIdb;
  return { env: await envAsync } as SetRootProps;
}
clientLoader.hydrate = true;

interface MetaWithDataArgs extends Route.MetaArgs {
  data: SetRootProps;
}
export function meta({ data }: MetaWithDataArgs) {
  let title = "スケジュール";
  return SetMetaDefault({ env: data?.env, title });
}

export default function Page() {
  return <SchedulePage />;
}
