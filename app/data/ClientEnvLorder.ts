import type { OmittedEnv } from "types/custom-configuration";

export let waitEnvResolve: (value: Partial<OmittedEnv>) => void;
export const envAsync = new Promise<Partial<OmittedEnv>>((resolve, reject) => {
  waitEnvResolve = resolve;
});
