import { atom, useAtom } from "jotai";
import { useEffect } from "react";
export const EnvAtom = atom<SiteConfigEnv>();

export function EnvState() {
  const [env, setEnv] = useAtom(EnvAtom);
  useEffect(() => {
    fetch("/env.json")
      .then((r) => r.json() as SiteConfigEnv)
      .then((env) => {
        setEnv(env);
      });
  }, []);
  return <></>;
}
