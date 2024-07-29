import { statSync, writeFileSync } from "fs";
import { configDotenv } from 'dotenv'

export function DateUTCString(date: Date = new Date()) {
  return date.toLocaleString("sv-SE", { timeZone: "UTC" }).replace(" ", "T") + "Z";
}
export type EnvType = { [k: string]: string | undefined };
export function readEnv(path: string): EnvType {
  const parsed = configDotenv({ path }).parsed;
  return parsed ? parsed as any : {};
}
export function writeEnv(path: string, env: EnvType) {
  writeFileSync(path, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"));
}
export function SetBuildDate(env: EnvType) {
  env.VITE_BUILD_TIME = DateUTCString();
  const cssFile = "./src/styles.scss";
  try {
    env.VITE_STYLES_TIME = DateUTCString(statSync(cssFile).mtime);
  } catch { }
  return env;
}

// envファイルのtrueやfalseをbooleanに変換する
export function envStringToBoolean() {
  return {
    name: 'env-string-to-boolean',
    configResolved(config: any) {
      const entries = Object.entries(config.env as Record<string, string>).map(([key, value]) => {
        const target = typeof value === 'string' ? value.toLowerCase() : value
        const results = {
          true: true,
          false: false,
          null: null
        } as any;
        return [key, results[target] === undefined ? value : results[target]]
      })
      config.env = Object.fromEntries(entries)
      return config
    }
  }
}

// envファイルの{}や[]に囲まれたものをJSONに変換する
export function envStringToObject() {
  return {
    name: 'env-string-to-object',
    configResolved(config: any) {
      const entries = Object.entries(config.env as Record<string, string>).map(([key, value]) => {
        if (typeof value === 'string' && (
          (value.startsWith("[") && value.endsWith("]"))
          || (value.startsWith("{") && value.endsWith("}"))
        )) {
          value = JSON.parse(value);
        }
        return [key, value];
      })
      config.env = Object.fromEntries(entries)
      return config
    }
  }
}

export function setBuildEnv(mode: string) {
  const envLocalPath = `.env.${mode}.local`;
  let env: EnvType = {};
  SetBuildDate(env);
  const prodEnv = readEnv('.env.production');
  env = { ...env, ...prodEnv };
  writeEnv(envLocalPath, env);
}
