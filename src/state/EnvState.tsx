import { getAPIOrigin, getMediaOrigin } from "@/functions/originUrl";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
export const EnvAtom = atom<SiteConfigEnv>();
export const ApiOriginAtom = atom<string>();
export const MediaOriginAtom = atom<string>();
export const isLoginAtom = atom(false);
export const visibleWorkersAtom = atom(false);

export function EnvState() {
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
      setApiOrigin(getAPIOrigin(env, location.origin));
      setMediaOrigin(getMediaOrigin(env, location.origin));
    }
  }, [env]);
  const setIsLogin = useAtom(isLoginAtom)[1];
  useEffect(() => {
    const serverData = document.getElementById("server-data");
    setIsLogin(serverData?.dataset.isLogin === "true");
  }, [setIsLogin]);
  return <></>;
}
