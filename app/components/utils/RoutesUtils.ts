import type { AppLoadContext } from "react-router";
import type { SetRootProps } from "./SetMeta";

export interface RouteBaseProps<P extends object> {
  context: AppLoadContext;
  params: P;
  request: Request;
}

export interface RouteBasePropsWithEnvProps<P extends object> extends RouteBaseProps<P> {
  env: Partial<Env>;
}

export function getDataFromMatches(
  matches?: (RouterMatchesType | undefined)[], id?: "root"): RouterMatchesType<SetRootProps> | undefined;
export function getDataFromMatches<T>(
  matches?: (RouterMatchesType | undefined)[], id?: string): RouterMatchesType<T> | undefined;

export function getDataFromMatches<T>(matches?: (RouterMatchesType<T> | undefined)[], id = "root") {
  const found = matches?.find((m) => m?.id === id);
  return found;
}
