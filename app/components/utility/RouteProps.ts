import type { AppLoadContext } from "react-router";

export interface RouteBaseProps<P extends object> {
  context: AppLoadContext;
  params: P;
  request: Request;
}

export interface RouteBasePropsWithEnvProps<P extends object> extends RouteBaseProps<P> {
  env: Partial<Env>;
}
