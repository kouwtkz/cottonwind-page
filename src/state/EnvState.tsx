import { getAPIOrigin, getMediaOrigin } from "@/functions/originUrl";
import { CreateState } from "./CreateState";
import { useEffect } from "react";
export const useEnv = CreateState<SiteConfigEnv>();
export const useApiOrigin = CreateState<string>();
export const useMediaOrigin = CreateState<string>();
export const useIsLogin = CreateState<boolean>();

export function EnvState() {
  const [env, setEnv] = useEnv();
  const setApiOrigin = useApiOrigin()[1];
  const setMediaOrigin = useMediaOrigin()[1];
  const setIsLogin = useIsLogin()[1];
  useEffect(() => {
    const serverData = document.getElementById("server-data");
    setIsLogin(Boolean(serverData?.dataset.isLogin === "true"));
  }, [setIsLogin]);
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
  return <></>;
}
