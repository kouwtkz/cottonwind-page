import type { NavigateFunction, NavigateOptions } from "react-router";
import { IdbLoadMap } from "~/data/ClientDBLoader";
import type { TableNameTypesWithAll } from "~/data/DataEnv";

export function NavReload(
  nav: NavigateFunction,
  options: NavigateOptions = {}
) {
  return nav(location.pathname + location.search + location.hash, {
    preventScrollReset: false,
    replace: true,
    ...options,
  });
}

interface IdbNavReloadProps {
  key?: TableNameTypesWithAll;
  load?: LoadStateType;
  nav: NavigateFunction;
  options?: NavigateOptions;
}
export function IdbNavReload({ key = "all", load = true, nav, options }: IdbNavReloadProps) {
  IdbLoadMap.set(key, load);
  return NavReload(nav, options);
}