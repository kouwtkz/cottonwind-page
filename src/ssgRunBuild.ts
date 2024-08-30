import { getPlatformProxy } from "wrangler";
import app_ssg from "./ssg";
import fs from "fs/promises";
import { basename, dirname } from "path";

export async function ssgRunBuild(dir = "static") {
  const proxy = await getPlatformProxy<MeeCommonEnv>();
  app_ssg.routes.forEach(async (route) => {
    await (async () =>
      app_ssg.fetch(new Request((proxy.env.ORIGIN ?? "http://localhost") + route.path), proxy.env)
    )().then(async (r) => {
      let routePath = route.path;
      if (basename(routePath).indexOf(".") < 0) routePath = routePath + ".html";
      const filepath = dir + routePath;
      await fs.mkdir(dirname(filepath), { recursive: true }).catch(() => { });
      await fs.writeFile(filepath, await r.text())
      console.log("- " + routePath);
    });
  })
  await proxy.dispose();
}

if (process.argv[2]) await ssgRunBuild(process.argv[2]);