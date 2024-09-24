import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { configDotenv } from 'dotenv'
import { Plugin, UserConfig, defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths';
import Sitemap from "vite-plugin-sitemap";
import { RoutingList } from './src/routes/RoutingList';
import { getPlatformProxy } from 'wrangler'
const { env, dispose } = await getPlatformProxy<MeeCommonEnv>();
dispose();

import fs from 'node:fs';
import path from 'node:path';
const __dirname = import.meta.dirname;

function fixSourceMaps(): Plugin {
  let currentInterval: NodeJS.Timeout | null = null
  return {
    name: 'fix-source-map',
    enforce: 'post',
    transform: function (source: any) {
      if (currentInterval) {
        return;
      }
      currentInterval = setInterval(function () {
        const nodeModulesPath = path.join(__dirname, 'node_modules', '.vite', 'deps');
        if (fs.existsSync(nodeModulesPath)) {
          clearInterval(currentInterval!);
          currentInterval = null;
          const files = fs.readdirSync(nodeModulesPath);
          files.forEach(function (file) {
            const mapFile = file + '.map';
            const mapPath = path.join(nodeModulesPath, mapFile);
            if (fs.existsSync(mapPath)) {
              let mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
              if (!mapData.sources || mapData.sources.length == 0) {
                mapData.sources = [path.relative(mapPath, path.join(nodeModulesPath, file))];
                fs.writeFileSync(mapPath, JSON.stringify(mapData), 'utf8');
              }
            }
          });
        }
      }, 100);
      return source;
    }
  }
}

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
      break;
    default:
      configDotenv();
      config.ssr = { external: ['axios', 'react', 'react-dom', 'xmldom', 'xpath', 'tsqlstring'] };
      config.plugins!.push([
        pages(),
        fixSourceMaps(),
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