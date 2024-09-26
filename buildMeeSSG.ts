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

export async function getStaticParamsFromModule(module: Record<string, any>) {
  const generateStaticParams = async () => {
    if (module.generateStaticParams) return module.generateStaticParams();
  }
  return generateStaticParams();
}

interface ssgRunBuildProps {
  src?: string;
  dir?: string;
  configPath?: string;
  env?: any;
  app?: CommonHono,
  staticParams?: KeyValueType<unknown>[];
}
export async function buildMeeSSG({ src = defaultSrc, dir = defaultDir, configPath = defaultConfigPath, env, app: _app, staticParams = [] }: ssgRunBuildProps = {}) {
  const messageObject: KeyValueType = { dir };
  if (!_app) {
    await import(src).then(async (m) => {
      if (m.default?.routes) {
        _app = m.default;
        const gottenStaticParams = await getStaticParamsFromModule(m);
        if (gottenStaticParams) staticParams = gottenStaticParams;
        messageObject.src = src;
        messageObject.config = configPath ?? "wrangler.toml";
      } else throw ("Honoがデフォルトのエクスポートじゃないです");
    });
  }
  if (!_app) return;
  const app = _app;
  console.log(messageObject);
  if (!env) {
    const proxy = await getPlatformProxy<MeeCommonEnv>({ configPath });
    env = proxy.env;
    await proxy.dispose();
  }
  await Promise.all(
    app.routes.map(async (route) => {
      let base = basename(route.path);
      let routePathes: string[];
      if (route.path.includes(":")) {
        const paramsList = route.path.split("/").filter(v => v.startsWith(":"));
        if (paramsList.length > 0) {
          routePathes = [];
          staticParams.forEach(list => {
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
      await Promise.all(
        routePathes.map(async (routePath) => {
          return {
            routePath,
            result: await (async () => app.fetch(new Request((env.ORIGIN ?? "http://localhost") + routePath), env))(),
          };
        })
      ).then(async (list) =>
        Promise.all(
          list.map(async ({ routePath, result: r }) => {
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
        ));
    }));
  console.log("Completed SSG build!")
}

if (basename(import.meta.url) === basename(process.argv[1])) await buildMeeSSG();
