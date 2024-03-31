import { NavigateFunction, NavigateOptions } from "react-router-dom";
import { MakeRelativeURL } from "./MakeURL";
import { KeyValueStringType } from "../../types/ValueType";

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
