import type { Route } from "../+types/root";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "",
    description: "",
  });
}

export default function Page() {
  return <></>;
}
