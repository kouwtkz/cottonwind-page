import type { Config } from "@react-router/dev/config";
import { getMeeD1DatabaseObject, getWranglerEnv, getWranglerSetting, prerenderCustomSSG, type PrerenderType } from "./react-router.custom";

const modes = import.meta.env.MODE.split("-");
function includeModes(v: string) {
  return modes.some(m => m === v);
}
const ssgMode = includeModes("ssg");
const calendarMode = includeModes("calendar");

let config = {
  ssr: true,
  future: {
    unstable_viteEnvironmentApi: true,
  },
} as Config;

if (calendarMode) {
  config = {
    ...config,
    ssr: import.meta.env.DEV,
    appDirectory: "app/calendar",
    buildDirectory: "dist/calendar",
    prerender: ["/"],
    async buildEnd(args) {
      const env = args.viteConfig.env as ImportMetaEnv;
      const fs = await import("fs");
      const path = await import("path");
      const config = await getWranglerSetting({ configFile: env.VITE_CALENDAR_CONFIG });
      delete config.main;
      if (config.configPath) config.configPath = path.resolve(config.configPath);
      if (config.userConfigPath) config.userConfigPath = path.resolve(config.userConfigPath);
      fs.writeFileSync(`${args.reactRouterConfig.buildDirectory}/wrangler.json`, JSON.stringify(config));
      const manifest = (await import("./app/calendar/manifest")).calendarManifest;
      fs.writeFileSync(`${args.reactRouterConfig.buildDirectory}/client/manifest.json`, JSON.stringify(manifest, null, 2));
    },
  };
} else if (import.meta.env.PROD) {
  if (ssgMode) {
    const db = await getMeeD1DatabaseObject();
    config.prerender = await prerenderCustomSSG({
      db, async prerenderSet(a, c) {
        switch (c) {
          case "/characters":
            a.push(c);
            const characters = await db?.select<CharacterDataType>({ table: "characters" });
            if (characters) {
              characters.map(v => {
                a.push(c + "/" + v.key);
              });
            }
            break;
          case "/login":
          case "/logout":
            break;
          default:
            a.push(c);
            break;
        }
      },
    });
    globalThis.meeGlobalDB = db;
    globalThis.globalEnv = await getWranglerEnv();
  }
}

export default config;
