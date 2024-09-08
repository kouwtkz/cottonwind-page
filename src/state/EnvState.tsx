import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { useCookies } from "react-cookie";
export const EnvAtom = atom<SiteConfigEnv>();
export const ApiOriginAtom = atom<string>();
export const MediaOriginAtom = atom<string>();
export const isLoginAtom = atom(false);
export const visibleWorkersAtom = atom(false);

export function EnvState() {
  const [cookies] = useCookies();
  const [env, setEnv] = useAtom(EnvAtom);
  const setApiOrigin = useAtom(ApiOriginAtom)[1];
  const setMediaOrigin = useAtom(MediaOriginAtom)[1];
  useEffect(() => {
    fetch("/env.json")
      .then((r) => r.json() as unknown as SiteConfigEnv)
      .then((env) => {
        setEnv(env);
      });
  }, []);
  useEffect(() => {
    if (env) {
      if (env.ORIGIN === location.origin) {
        setApiOrigin(env.API_ORIGIN);
        setMediaOrigin(env.MEDIA_ORIGIN);
      } else if (env.PAGES_DEV_ORIGIN === location.origin) {
        setApiOrigin(env.API_WORKERS_ORIGIN);
        setMediaOrigin(env.MEDIA_WORKERS_ORIGIN);
      } else {
        setApiOrigin(env.API_LOCAL_ORIGIN);
        setMediaOrigin(env.MEDIA_LOCAL_ORIGIN);
      }
    }
  }, [env]);
  const setIsLogin = useAtom(isLoginAtom)[1];
  useEffect(() => {
    const serverData = document.getElementById("server-data");
    setIsLogin(serverData?.dataset.isLogin === "true");
  }, [setIsLogin]);
  return <></>;
}
