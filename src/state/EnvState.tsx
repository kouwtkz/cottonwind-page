import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { useCookies } from "react-cookie";
export const EnvAtom = atom<SiteConfigEnv>();
export const ApiOriginAtom = atom<string>();
export const isLoginAtom = atom(false);
export const visibleWorkersAtom = atom(false);

export function EnvState() {
  const [cookies] = useCookies();
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
  const [isLogin, setIsLogin] = useAtom(isLoginAtom);
  const setVisibleWorkers = useAtom(visibleWorkersAtom)[1];
  useEffect(() => {
    const serverData = document.getElementById("server-data");
    setIsLogin(serverData?.dataset.isLogin === "true");
  }, [setIsLogin]);
  useEffect(() => {
    if (isLogin) setVisibleWorkers("VisibleWorkers" in cookies);
  }, [isLogin, cookies]);
  return <></>;
}
