import { createServer } from "vite";
import { Adapter } from 'node_modules/@hono/vite-dev-server/dist/types';
import { Plugin } from 'vite';
import { buildMeeSSG } from "./buildMeeSSG";

interface buildMeeSsgPluginsProps {
  entry?: string;
  adapter?: Adapter
}

export function buildMeeSSG_Plugins({ entry = "./src/index.tsx", adapter }: buildMeeSsgPluginsProps = {}) {
  const virtualId = "virtual:ssg-void-entry";
  const resolvedVirtualId = "\0" + virtualId;
  let config: any;
  return {
    name: "meeSSGBuild",
    apply: "build",
    async config() {
      return {
        build: {
          rollupOptions: {
            input: [virtualId]
          }
        }
      };
    },
    configResolved(resolved: any) {
      config = resolved;
    },
    resolveId(id: any) {
      if (id === virtualId) {
        return resolvedVirtualId;
      }
    },
    load(id: any) {
      if (id === resolvedVirtualId) {
        return 'console.log("suppress empty chunk message")';
      }
    },
    async generateBundle(_outputOptions, bundle) {
      const server = await createServer({
        plugins: [],
        build: { ssr: true }
      });
      const module = await server.ssrLoadModule(entry);
      server.close();
      const app = module["default"];
      if (!app) {
        throw new Error(`Failed to find a named export "default" from ${entry}`);
      }
      const dir = config.build.outDir;
      await buildMeeSSG({ app, dir, env: adapter?.env, staticParams: module["generateStaticParams"] });
      if (adapter?.onServerClose) adapter.onServerClose();
    },
  } as Plugin
}

export default buildMeeSSG_Plugins;
