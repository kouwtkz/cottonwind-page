import type { AppLoadContext } from "react-router";
import { getCookie, type getCookiePropsEither } from "./Cookie";
import { getCfEnv } from "~/data/cf/getEnv";
import { getSession } from "~/sessions.server";

interface IsLoginProps extends getCookiePropsEither {
  env?: Partial<Env>;
  context?: AppLoadContext;
  trueWhenDev?: boolean;
}
export async function IsLogin(
  { env, context, trueWhenDev, request, ...c }: IsLoginProps
) {
  if (!env && context) env = getCfEnv({ context });
  // if (trueWhenDev && import.meta.env?.DEV) return import.meta.env.DEV;
  const session = await getSession(request?.headers.get("Cookie"));
  return env?.LOGIN_TOKEN === session.get("LoginToken");
}

interface LoginCheckProps<N> extends IsLoginProps {
  env?: Partial<Env>;
  next(props: IsLoginProps): N;
}
export async function LoginCheck<N = any>({ next, env, ...props }: LoginCheckProps<N>) {
  if (!env) env = getCfEnv(props);
  const withProps = { ...props, env };
  if (await IsLogin(withProps)) return next(withProps);
  else return new Response("403 Forbidden", { status: 403 });
}
