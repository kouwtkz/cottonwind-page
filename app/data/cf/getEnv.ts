import type { AppLoadContext } from "react-router";
import type { MeeSqlClass } from "../functions/MeeSqlClass";
import { MeeSqlD1 } from "../functions/MeeSqlD1";

interface getCfProps {
  context?: AppLoadContext;
}
export function getCfEnv<E = Partial<Env>>({ context }: getCfProps = {}): E {
  if (context?.cloudflare) return context.cloudflare.env as E;
  else if (globalThis.globalEnv) return globalThis.globalEnv as E;
  else return {} as E;
}

export function getCfDB({ context }: getCfProps = {}): MeeSqlClass | null {
  if (context?.cloudflare && "DB" in context.cloudflare.env)
    return new MeeSqlD1(context.cloudflare.env.DB)
  else if (globalThis.meeGlobalDB) return globalThis.meeGlobalDB;
  else return null;
}

