import type { Route } from "./+types/home";
import { Home } from "~/page/Home";
import { useRouteLoaderData } from "react-router";
import type { SetRootProps } from "~/components/utils/SetMeta";

export default function Page({ loaderData }: Route.ComponentProps) {
  return <Home />;
}
