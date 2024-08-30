import { atom, useAtom } from "jotai";
import { useEffect } from "react";
export const EnvAtom = atom<SiteConfigEnv>();
export const ApiOriginAtom = atom<string>();

export function EnvState() {
  const [env, setEnv] = useAtom(EnvAtom);
  const setApiOrigin = useAtom(ApiOriginAtom)[1];
  useEffect(() => {
    fetch("/env.json")
      .then((r) => r.json() as SiteConfigEnv)
      .then((env) => {
        setEnv(env);
      });
  }, []);
  useEffect(() => {
    if (env) {
      if (env.ORIGIN === location.origin) setApiOrigin(env.API_ORIGIN);
      else if (env.PAGES_DEV_ORIGIN === location.origin)
        return setApiOrigin(env.API_WORKERS_ORIGIN);
      else return setApiOrigin(env.API_LOCAL_ORIGIN);
    }
  }, [env]);
  return <></>;
}
