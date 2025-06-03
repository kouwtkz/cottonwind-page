import type { AppLoadContext } from "react-router";
import { getCookie, type getCookiePropsEither } from "./Cookie";
import { getCfEnv } from "~/data/cf/getEnv";
import type { ServerEnv } from "types/custom-configuration";

interface IsLoginProps extends getCookiePropsEither {
  env?: Partial<Env>;
  context?: AppLoadContext;
  trueWhenDev?: boolean;
}
export function IsLogin(
  { env, context, trueWhenDev, ...c }: IsLoginProps
) {
  if (!env && context) env = getCfEnv({ context });
  if (trueWhenDev && import.meta.env?.DEV) return import.meta.env.DEV;
  return env?.LOGIN_TOKEN === getCookie({ ...c, key: "LoginToken" });
}

interface LoginCheckProps<N> extends IsLoginProps {
  env?: Partial<Env>;
  next(props: IsLoginProps): N;
}
export function LoginCheck<N = any>({ next, env, ...props }: LoginCheckProps<N>) {
  if (!env) env = getCfEnv<ServerEnv>(props);
  const withProps = { ...props, env };
  if (IsLogin(withProps)) return next(withProps);
  else return new Response("403 Forbidden", { status: 403 });
}
