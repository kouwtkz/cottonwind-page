import type { OmittedEnv } from "types/custom-configuration";
import { type Unstable_Config, unstable_readConfig } from "wrangler";
import type { MeeSqlClass } from "~/data/functions/MeeSqlClass";

export type PrerenderType = boolean | string[] | ((args: {
  getStaticPaths: () => string[];
}) => Array<string> | Promise<Array<string>>) | undefined;
export type PrerenderOptionType = PrerenderType | "default";

interface prerenderSSGProps {
  db?: MeeSqlClass | null;
  logList?: boolean;
  prerenderSet?(a: string[], c: string): Promise<void>;
  PrerenderOption?: PrerenderOptionType;
}
export async function prerenderCustomSSG({ db, prerenderSet, PrerenderOption = "default", logList }: prerenderSSGProps = {}): Promise<PrerenderType> {
  if (!db) db = await getMeeD1DatabaseObject();
  return async ({ getStaticPaths }) => {
    let list = getStaticPaths();
    if (prerenderSet) {
      list = await list.reduce(async (_a: Promise<string[]>, c) => {
        const a = await _a;
        await prerenderSet(a, c);
        return _a;
      }, Promise.resolve([]));
    }
    if (logList) console.log(list);
    return list;
  }
}

interface getWranglerSettingProps {
  configFile?: string;
}
export async function getWranglerSetting({ configFile = "./wrangler.jsonc" }: getWranglerSettingProps = {}) {
  return unstable_readConfig({ config: configFile });
}
interface getWranglerEnvProps extends getWranglerSettingProps {
  config?: Unstable_Config;
}
export async function getWranglerEnv({ config, ...props }: getWranglerEnvProps = {}) {
  config = config ?? await getWranglerSetting(props);
  return config.vars as unknown as OmittedEnv;
}

export async function getMeeD1DatabaseObject({ index = 0 }: { index?: number } = {}) {
  const wranglerStatePath = ".wrangler/state/v3";
  const wranglerStateD1Path = wranglerStatePath + "/d1/miniflare-D1DatabaseObject";
  const fs = await import("fs");
  const list = fs.readdirSync(wranglerStateD1Path);
  if (list.length) {
    const dbFilename = list[index];
    const dbFilePath = wranglerStateD1Path + "/" + dbFilename;
    const { MeeSqlite } = await import("./app/data/functions/MeeSqlite");
    const db = new MeeSqlite(dbFilePath);
    return db;
  }
  return null;
}

