import type { Route } from "./+types/suggest";
import { SetMetaDefault, type SetRootProps } from "~/components/utils/SetMeta";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";
import SuggestPage from "~/page/SuggestPage";
import { useRouteLoaderData } from "react-router";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "ていあん",
    description: "打ち間違いなど用の誘導",
  });
}

export default function Page() {
  const data = useRouteLoaderData<SetRootProps>("root");

  return <SuggestPage env={data?.env} />;
}
