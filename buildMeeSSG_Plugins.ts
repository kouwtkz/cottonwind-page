import { createServer } from "vite";
import { Adapter } from 'node_modules/@hono/vite-dev-server/dist/types';
import { Plugin } from 'vite';
import { buildMeeSSG, getStaticParamsFromModule } from "./buildMeeSSG";

interface buildMeeSsgPluginsProps {
  entry?: string;
  adapter?: Adapter
  mode?: string;
}

export function buildMeeSSG_Plugins({ entry = "./src/index.tsx", adapter, mode }: buildMeeSsgPluginsProps = {}) {
  const virtualId = "virtual:mee-ssg-void-entry";
  const resolvedVirtualId = "\0" + virtualId;
  let config: any;
  return {
    name: "buildMeeSSG",
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
        build: { ssr: true },
        mode
      });
      const m = await server.ssrLoadModule(entry);
      server.close();
      const app = m.default;
      if (!app) {
        throw new Error(`Failed to find a named export "default" from ${entry}`);
      }
      const dir = config.build.outDir;
      const env = adapter?.env;
      await buildMeeSSG({ app, dir, env, staticParams: await getStaticParamsFromModule(m, env) });
      if (adapter?.onServerClose) adapter.onServerClose();
    },
  } as Plugin
}

export default buildMeeSSG_Plugins;
