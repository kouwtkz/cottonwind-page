import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { configDotenv } from 'dotenv'
import { UserConfig, defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths';
import Sitemap from "vite-plugin-sitemap";
import { RoutingList } from './src/routes/RoutingList';
import { getPlatformProxy } from 'wrangler'
const { env, dispose } = await getPlatformProxy<MeeCommonEnv>();
dispose();

export default defineConfig(({ mode }) => {
  let config: UserConfig = {
    optimizeDeps: { include: [] },
    plugins: [tsconfigPaths()]
  };
  switch (mode) {
    case "client":
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
      break;
    default:
      configDotenv();
      config.ssr = { external: ['axios', 'react', 'react-dom', 'xmldom', 'xpath'] };
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
        Sitemap({
          hostname: env.ORIGIN,
          generateRobotsTxt: true,
          dynamicRoutes: RoutingList.filter(v => !/:/.test(v)),
          exclude: ["/404", "/500", "/suggest"]
        }),
      ])
      break;
  }
  return config;
})