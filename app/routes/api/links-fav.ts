import { LoginCheck } from "~/components/utils/Admin";
import type { Route } from "./+types/links";
import { SiteLinkServerClass } from "./links";
import { linksFavDataOptions } from "~/data/DataEnv";

export const SiteFavLinkServer = new SiteLinkServerClass(linksFavDataOptions);
export async function action(props: Route.ActionArgs) {
  if (props.params.action === "verify") return SiteFavLinkServer.verify.bind(SiteFavLinkServer)(props);
  else return LoginCheck({ ...props, next: SiteFavLinkServer.next.bind(SiteFavLinkServer), trueWhenDev: true });
}
