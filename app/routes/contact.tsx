import type { Route } from "./+types/contact";
import { SetMetaDefault, type SetRootProps } from "~/components/utils/SetMeta";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";
import ContactPage from "~/page/ContactPage";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "れんらく",
    description: "連絡用のページ",
  });
}

export default function Page() {
  return <ContactPage />;
}
