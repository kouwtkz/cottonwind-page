import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import ssg from '@hono/vite-ssg'
import { configDotenv } from 'dotenv'
import { UserConfig, defineConfig } from 'vite'
import { writeFileSync } from "fs"
import tsconfigPaths from 'vite-tsconfig-paths';
import Sitemap from "vite-plugin-sitemap";
import { serverSite } from "./src/data/server/site";
import { RoutingList } from './src/routes/RoutingList'

const localEnv = ".env.local"
function EnvBuildDateWrite() {
  const parsed = configDotenv({ path: localEnv }).parsed;
  const env: { [k: string]: string } = parsed ? parsed as any : {}
  env.VITE_BUILD_TIME = new Date().toLocaleString("sv-SE", { timeZone: "UTC" }).replace(" ", "T") + "Z";
  writeFileSync(localEnv, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"))
}

export default defineConfig(({ mode }) => {
  EnvBuildDateWrite();
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
    config.ssr = { external: ['react', 'react-dom'] };
    config.plugins!.push([
      pages(),
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
      ssg({entry: "./src/ssg.tsx"}),
      Sitemap({
        hostname: serverSite.url,
        generateRobotsTxt: true,
        dynamicRoutes: RoutingList.filter(v => !/:/.test(v)),
        exclude: ["/404"]
      }),
    ])
  }
  return config;
})