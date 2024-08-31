import { getPlatformProxy } from "wrangler";
import fs from "fs/promises";
import { basename, dirname } from "path";
import { CommonHono } from "./types/HonoCustomType";

let src = "src/ssg"
let dir = "dist"
let configPath: string | undefined = undefined;
type previousType = "" | "src" | "dir" | "config";

process.argv.reduce<previousType>((a, c) => {
  if (c.startsWith("-")) {
    switch (c) {
      case "-s":
      case "--src":
        return "src";
      case "-d":
      case "--dir":
        return "dir";
      case "-c":
      case "--config":
        return "config";
      case "-h":
      case "--help":
        console.log("--src, -s: Hono script source (default: src/ssg)");
        console.log("--dir, -d: Output directry (default: dist)");
        console.log("--config, -c: Config .toml file (default: wrangler.toml)");
        console.log("--help, -h: Help");
        process.exit();
      default:
        return "";
    }
  } else {
    switch (a) {
      case "src":
        src = c;
        break;
      case "dir":
        dir = c;
        break;
      case "config":
        configPath = c;
        break;
    }
    return "";
  }
}, "");

const app = await import(src).then(m => {
  if (m.default?.routes) return m.default as CommonHono;
  else throw ("Honoがデフォルトのエクスポートじゃないです");
});
console.log({ src, dir, config: configPath ?? "wrangler.toml" });

const proxy = await getPlatformProxy<MeeCommonEnv>({ configPath });
app.routes.forEach(async (route) => {
  await (async () =>
    app.fetch(new Request((proxy.env.ORIGIN ?? "http://localhost") + route.path), proxy.env)
  )().then(async (r) => {
    if (route.method === "GET") {
      let routePath = route.path;
      if (basename(routePath).indexOf(".") < 0) routePath = routePath + ".html";
      const filepath = dir + routePath;
      await fs.mkdir(dirname(filepath), { recursive: true }).catch(() => { });
      await fs.writeFile(filepath, await r.text())
      console.log("- " + routePath);
    }
  });
})

await proxy.dispose();
