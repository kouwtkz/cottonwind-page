import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import ssg from '@hono/vite-ssg'
import { configDotenv } from 'dotenv'
import { UserConfig, defineConfig } from 'vite'
import { writeFileSync, statSync } from "fs"
import tsconfigPaths from 'vite-tsconfig-paths';
import Sitemap from "vite-plugin-sitemap";
import { RoutingList } from './src/routes/RoutingList';
import { dataUpdateServerPlugins } from './src/mediaScripts/dataUpdate/updateServer'
import { ViteToml } from 'vite-plugin-toml'

function DateUTCString(date: Date = new Date()) {
  return date.toLocaleString("sv-SE", { timeZone: "UTC" }).replace(" ", "T") + "Z";
}
type EnvType = { [k: string]: string | undefined };
function readEnv(path: string): EnvType {
  const parsed = configDotenv({ path }).parsed;
  return parsed ? parsed as any : {};
}
function writeEnv(path: string, env: EnvType) {
  writeFileSync(path, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"));
}
function SetBuildDate(env: EnvType) {
  env.VITE_BUILD_TIME = DateUTCString();
  const cssFile = "./src/styles.scss";
  try {
    env.VITE_STYLES_TIME = DateUTCString(statSync(cssFile).mtime);
  } catch { }
  return env;
}

export default defineConfig(({ mode }) => {
  const envLocalPath = `.env.${mode}.local`;
  let env: EnvType = {};
  SetBuildDate(env);
  switch (mode) {
    case 'client':
      const prodEnv = readEnv('.env.production');
      env = { ...env, ...prodEnv };
      break;
  }
  writeEnv(envLocalPath, env);
  let config: UserConfig = {
    optimizeDeps: { include: [] },
    plugins: [tsconfigPaths()]
  };
  if (mode === 'client') {
    config.build = {
      rollupOptions: {
        input: [
          './src/client.tsx',
          './src/styles.scss',
          'src/workers/twix/twixClient.tsx'
        ],
        output: {
          entryFileNames: `static/js/[name].js`,
          chunkFileNames: `static/js/[name].js`,
          assetFileNames: (assetInfo) => {
            const name = assetInfo?.name ?? "";
            if (/\.(gif|jpeg|jpg|png|svg|webp)$/.test(name)) {
              return 'static/images/[name].[ext]';
            }
            if (/\.css$/.test(name)) {
              return 'css/[name].[ext]';
            }
            return 'static/[name].[ext]';
          }
        }
      },
      // manifest: true,
      chunkSizeWarningLimit: 3000
    }
  } else {
    configDotenv();
    // if (mode === "development") console.log(process)
    // if (mode === "development") dataUpdateServer();
    config.ssr = { external: ['axios', 'react', 'react-dom', 'xmldom', 'xpath'] };
    config.plugins!.push([
      pages(),
      ViteToml(),
      dataUpdateServerPlugins(),
      devServer({
        entry: 'src/index.dev.tsx',
        adapter,
        exclude: [
          // /.*\.css$/,
          /.*\.ts$/,
          /.*\.tsx$/,
          /^\/@.+$/,
          /\?t\=\d+$/,
          /^\/favicon\.ico$/,
          /^\/static\/.+/,
          /^\/node_modules\/.*/,
        ],
      }),
      ssg({ entry: "./src/ssg.tsx" }),
      Sitemap({
        hostname: process.env.VITE_URL,
        generateRobotsTxt: true,
        dynamicRoutes: RoutingList.filter(v => !/:/.test(v)),
        exclude: ["/404", "/500", "/suggest"]
      }),
    ])
  }
  return config;
})