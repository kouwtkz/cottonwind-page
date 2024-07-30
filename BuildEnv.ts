import { statSync, writeFileSync } from "fs";
import { configDotenv } from 'dotenv'

export type EnvType = { [k: string]: string | undefined };
export function readEnv(path: string): EnvType {
  const parsed = configDotenv({ path }).parsed;
  return parsed ? parsed as any : {};
}
export function writeEnv(path: string, env: EnvType) {
  writeFileSync(path, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"));
}

export function SetBuildDate(env: EnvType) {
  env.VITE_BUILD_TIME = new Date().toISOString();
  const cssFile = "./src/styles.scss";
  try {
    env.VITE_STYLES_TIME = new Date(statSync(cssFile).mtimeMs).toISOString();
  } catch { }
  return env;
}

export function setBuildEnv(mode: string) {
  const envLocalPath = `.env.${mode}.local`;
  let env: EnvType = {};
  SetBuildDate(env);
  const prodEnv = readEnv('.env.production');
  env = { ...env, ...prodEnv };
  writeEnv(envLocalPath, env);
}
