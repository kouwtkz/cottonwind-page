import { LoginCheck } from "~/components/utils/Admin";
import type { Route } from "./+types/links-fav";
import { SiteLinkServerClass } from "./links";
import { linksFavDataOptions } from "~/data/DataEnv";

export const SiteFavLinkServer = new SiteLinkServerClass<Route.ActionArgs>(linksFavDataOptions);
export async function action(props: Route.ActionArgs) {
  return LoginCheck({ ...props, next: SiteFavLinkServer.next.bind(SiteFavLinkServer), trueWhenDev: true });
}
