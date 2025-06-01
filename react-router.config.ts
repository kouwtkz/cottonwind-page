import type { Config } from "@react-router/dev/config";
import { getMeeD1DatabaseObject, getWranglerEnv, prerenderCustomSSG, type PrerenderType } from "./react-router.custom";

let prerender: PrerenderType = true;
if (prerender && process.env.npm_lifecycle_event === "build") {
  const db = await getMeeD1DatabaseObject();
  prerender = await prerenderCustomSSG({
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
        default:
          a.push(c);
          break;
      }
    },
  });
  globalThis.meeGlobalDB = db;
  globalThis.globalEnv = await getWranglerEnv();
}

export default {
  ssr: true,
  prerender,
  future: {
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config;
