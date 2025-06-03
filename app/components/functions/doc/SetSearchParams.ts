import type { NavigateFunction, NavigateOptions } from "react-router";
import { MakeRelativeURL } from "./MakeURL";

interface SetSearchParamBaseProps {
  nav: NavigateFunction;
  options?: NavigateOptions;
}
interface SetSearchParamProps extends SetSearchParamBaseProps {
  query: KeyValueStringType;
}
export function SetSearchParams({ nav, query, options }: SetSearchParamProps) {
  return nav(MakeRelativeURL({ query }), options);
}
export function getSearchParams() {
  return Object.fromEntries(new URLSearchParams(location.search));
}
