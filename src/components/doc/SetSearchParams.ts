import { NavigateFunction, NavigateOptions } from "react-router-dom";
import { MakeRelativeURL } from "./MakeURL";

interface SetSearchParamBaseProps {
  nav: NavigateFunction;
  options?: NavigateOptions;
}
interface SetSearchParamProps extends SetSearchParamBaseProps {
  query: { [k: string]: string | undefined };
}
export function SetSearchParams({ nav, query, options }: SetSearchParamProps) {
  return nav(MakeRelativeURL({ query }), options);
}
export function getSearchParams() {
  return Object.fromEntries(new URLSearchParams(location.search));
}

export function toggleEditParam({ options, ...args }: SetSearchParamBaseProps) {
  const query = getSearchParams();
  if (query.mode === "edit") {
    delete query.mode;
  } else {
    query.mode = "edit";
  }
  SetSearchParams({ query, options: { replace: true, preventScrollReset: true, ...options }, ...args });
}
