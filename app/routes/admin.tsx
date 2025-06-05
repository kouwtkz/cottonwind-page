import { getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/admin";
import { waitIdb } from "~/data/ClientDBLoader";
import { envAsync } from "~/data/ClientEnvLorder";
import { SetMetaDefault } from "~/components/SetMeta";
import type { SetRootMetaProps } from "~/data/rootData";
import { AdminPage } from "~/page/AdminPage";
import { Link } from "react-router";

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
  let title = "かんり";
  return SetMetaDefault({ env: data?.env, title });
}

export default function Page() {
  return (
    <>
      <AdminPage />
    </>
  );
}
