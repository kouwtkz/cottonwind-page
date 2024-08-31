import { getPlatformProxy } from "wrangler";
import fs from "fs/promises";
import { basename, dirname } from "path";
import { CommonHono } from "./src/types/HonoCustomType";

let defaultSrc = "src/index"
let defaultDir = "dist"
let defaultConfigPath: string | undefined = undefined;
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
        console.log("--src, -s: Hono script source (default: src/index)");
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
        defaultSrc = c;
        break;
      case "dir":
        defaultDir = c;
        break;
      case "config":
        defaultConfigPath = c;
        break;
    }
    return "";
  }
}, "");

interface ssgRunBuildProps {
  src?: string;
  dir?: string;
  configPath?: string;
  env?: any;
  staticParams?: KeyValueType<unknown>[];
}
export async function buildMeeSSG({ src = defaultSrc, dir = defaultDir, configPath = defaultConfigPath, env, staticParams = [] }: ssgRunBuildProps = {}) {
  const { app, generateStaticParams }: { app: CommonHono, generateStaticParams: () => Promise<(KeyValueType<unknown>[] | void)> } =
    await import(src).then(m => {
      if (m.default?.routes) {
        return {
          app: m.default,
          generateStaticParams: async () => {
            if (m.generateStaticParams) return m.generateStaticParams();
          }
        };
      } else throw ("Honoがデフォルトのエクスポートじゃないです");
    });
  console.log({ src, dir, config: configPath ?? "wrangler.toml" });

  const params = (await generateStaticParams() ?? []).concat(staticParams);
  const proxy = await getPlatformProxy<MeeCommonEnv>({ configPath });
  app.routes.forEach(async (route) => {
    let base = basename(route.path);
    let routePathes: string[];
    if (route.path.includes(":")) {
      const paramsList = route.path.split("/").filter(v => v.startsWith(":"));
      if (paramsList.length > 0) {
        routePathes = [];
        params.forEach(list => {
          const routePath = Object.entries(list).reduce((path, [k, v]) => {
            path = path.replace(RegExp("/:" + k + "(/|$)"), (m, m1) => "/" + String(v) + m1);
            return path;
          }, route.path)
          if (!routePath.includes(":")) routePathes.push(routePath);
        })
      } else routePathes = [];
    } else {
      routePathes = [route.path];
    }
    let proxyEnv = { ...proxy.env, ...env };
    Promise.all(
      routePathes.map(async (routePath) => {
        return {
          routePath,
          result: await (async () => app.fetch(new Request((proxy.env.ORIGIN ?? "http://localhost") + routePath), proxyEnv))(),
        };
      })
    ).then(async (list) => {
      list.forEach(async ({ routePath, result: r }) => {
        const isErrorPage = base && !isNaN(Number(base));
        if ((r.ok || isErrorPage) && route.method === "GET") {
          if (base.indexOf(".") < 0) {
            if (isErrorPage) routePath = routePath + ".html";
            else routePath = routePath + (base ? "/" : "") + "index.html";
          }
          const filepath = dir + routePath;
          await fs.mkdir(dirname(filepath), { recursive: true }).catch(() => { });
          await fs.writeFile(filepath, await r.text())
          console.log("- " + routePath);
        }
      })
    });;
  })
  await proxy.dispose();
}

if (basename(import.meta.url) === basename(process.argv[1])) await buildMeeSSG();
