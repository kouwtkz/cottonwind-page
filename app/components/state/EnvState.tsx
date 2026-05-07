import { CreateState } from "./CreateState";
import { useEffect } from "react";
import type { OmittedEnv } from "types/custom-configuration";

export const useEnv = CreateState<Partial<OmittedEnv>>();
export const useIsLogin = CreateState<boolean>();

interface EnvStateProps {
  env?: Partial<OmittedEnv>;
  isLogin?: boolean;
}
export function EnvState({ env, isLogin }: EnvStateProps) {
  const setEnv = useEnv()[1];
  useEffect(() => {
    if (env) setEnv(env);
  }, [env]);
  const SetIsLoginState = useIsLogin()[1];
  useEffect(() => {
    SetIsLoginState(isLogin);
  }, [isLogin]);
  return <></>;
}
