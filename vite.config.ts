import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { configDotenv } from 'dotenv'
import { UserConfig, defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths';
import Sitemap from "vite-plugin-sitemap";
import { RoutingList } from './src/routes/RoutingList';
import { getPlatformProxy } from 'wrangler'
import buildMeeSSG_Plugins from './buildMeeSSG_Plugins'

export default defineConfig(async ({ mode }) => {
  let config: UserConfig = {
    optimizeDeps: { include: [] },
    plugins: [tsconfigPaths()],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        }
      }
    }
  };
  if (mode === "client") {
    config.build = {
      rollupOptions: {
        input: [
          './src/client.tsx',
          './src/styles.scss',
          './src/styles-import.scss',
          './src/workers/twix/twixClient.tsx'
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
        },
        onwarn(warning, warn) {
          // Suppress "Module level directives cause errors when bundled" warnings
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return;
          }
          warn(warning);
        },
      },
      // manifest: true,
      chunkSizeWarningLimit: 3000
    }
  } else if (mode === "ssg") {
    const { env, dispose } = await getPlatformProxy<MeeCommonEnv>();
    const entry = "src/ssg.tsx";
    config.plugins!.push([
      buildMeeSSG_Plugins({ entry, adapter: { env, onServerClose: dispose } }),
      Sitemap({
        hostname: env.ORIGIN,
        generateRobotsTxt: true,
        dynamicRoutes: RoutingList.filter(v => !/:/.test(v)),
        exclude: ["/404", "/500", "/suggest"]
      }),
    ]);
  } else {
    configDotenv();
    config.ssr = { external: ['axios', 'react', 'react-dom', 'xmldom', 'xpath', 'tsqlstring'] };
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
    ])
  }
  return config;
})