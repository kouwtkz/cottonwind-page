import pages from '@hono/vite-cloudflare-pages';
import devServer from '@hono/vite-dev-server';
import adapter from '@hono/vite-dev-server/cloudflare';
import { BuildOptions, PluginOption, UserConfig, defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import Sitemap from "vite-plugin-sitemap";
import { RoutingList } from './src/routes/RoutingList';
import { getPlatformProxy } from 'wrangler';
import buildMeeSSG_Plugins from './buildMeeSSG_Plugins';
import basicSsl from '@vitejs/plugin-basic-ssl';

const defaultBuild: BuildOptions = {
  outDir: "dist",
  emptyOutDir: false,
  copyPublicDir: false,
};
const publicDirBuild: BuildOptions = {
  outDir: "public",
  emptyOutDir: false,
  copyPublicDir: false,
}
interface setClientBuildOptionsProps {
  dir_assets?: string;
  dir_js?: string;
  dir_css?: string;
  dir_images?: string;
}
function setClientBuildOptions({ dir_assets = "assets", dir_js, dir_css, dir_images }: setClientBuildOptionsProps = {}) {
  return ({
    rollupOptions: {
      output: {
        entryFileNames: `${dir_js || dir_assets}/[name].js`,
        chunkFileNames: `${dir_js || dir_assets}/[name].js`,
        assetFileNames: (assetInfo) => {
          const name = assetInfo?.name ?? "";
          if (/\.(gif|jpeg|jpg|png|svg|webp)$/.test(name)) {
            return `${dir_images || dir_assets}/[name].[ext]`;
          }
          if (/\.css$/.test(name)) {
            return `${dir_css || dir_assets}/[name].[ext]`;
          }
          return `${dir_assets}/[name].[ext]`;
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
  } as BuildOptions).rollupOptions;
}

const devExclude: (string | RegExp)[] = [
  // /.*\.css$/,
  /.*\.ts$/,
  /.*\.tsx$/,
  /^\/@.+$/,
  /\?t\=\d+$/,
  /^\/favicon\.ico$/,
  /^\/static\/.+/,
  /^\/node_modules\/.*/,
];

export default defineConfig(async ({ mode }) => {
  let defaultPlugins: PluginOption[] = [tsconfigPaths()];
  let config: UserConfig = {
    optimizeDeps: { include: [] },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        }
      }
    }
  };
  const modes = mode.split("-");
  function includeModes(v: string) {
    return modes.some(m => m === v);
  }
  if (includeModes("ssl")) defaultPlugins.push(basicSsl());
  if (includeModes("client")) {
    const clientInput: Array<string> = [];
    const clientOptions = {
      ...config,
      plugins: defaultPlugins,
      build: {
        ...defaultBuild,
        emptyOutDir: modes[1] === "overwrite",
        rollupOptions: {
          ...setClientBuildOptions({
            dir_assets: "static",
            dir_js: "static/js",
            dir_css: "css",
            dir_images: "static/images"
          }),
          input: clientInput,
        },
        // manifest: true,
        // minify: false,
        chunkSizeWarningLimit: 3000
      }
    } as UserConfig;
    if (includeModes("twix")) {
      clientInput.push('./src/workers/twix/twixClient.tsx');
    } else {
      clientInput.push(
        './src/client.tsx',
        './src/clientBefore.ts',
        './src/styles.scss',
        './src/styles/styles_lib.scss',
      );
    }
    return clientOptions;
  } else if (includeModes("calendar")) {
    if (includeModes("ssg")) {
      return {
        ...config,
        build: {
          ...defaultBuild,
          emptyOutDir: true,
          outDir: "src/calendar/dist",
          rollupOptions: {
            ...setClientBuildOptions(),
            input: [
              './src/calendar/client.tsx',
              './src/clientBefore.ts',
              './src/styles.scss',
              './src/styles/styles_lib.scss',
            ]
          },
          chunkSizeWarningLimit: 1000
        },
        plugins: [
          ...defaultPlugins,
          buildMeeSSG_Plugins({ entry: "src/calendar/index.production.tsx" }),
        ],
      } as UserConfig;
    } else {
      return {
        ...config,
        build: defaultBuild,
        plugins: [
          ...defaultPlugins,
          pages(),
          devServer({
            entry: 'src/calendar/index.dev.tsx',
            adapter,
            exclude: devExclude,
          }),
        ],
        server: {
          allowedHosts: ["dp7-test.cottonwind.com"],
        }
      } as UserConfig;
    }
  } else if (includeModes("ssg")) {
    const { env, dispose } = await getPlatformProxy<MeeCommonEnv>();
    const entry = "src/ssg.tsx";
    return {
      ...config,
      build: {
        ...defaultBuild,
        emptyOutDir: modes[1] === "overwrite",
        copyPublicDir: true,
      },
      plugins: [
        ...defaultPlugins,
        buildMeeSSG_Plugins({ entry, adapter: { env, onServerClose: dispose } }),
        Sitemap({
          outDir: defaultBuild.outDir,
          hostname: env.ORIGIN,
          generateRobotsTxt: true,
          dynamicRoutes: RoutingList.filter(v => !/:/.test(v)),
          exclude: ["/404", "/500", "/suggest"]
        }),
      ],
    } as UserConfig;
  } else if (includeModes("media")) {
    return {
      ...config,
      plugins: [
        ...defaultPlugins,
        devServer({
          entry: 'src/media.ts',
          adapter: adapter({ proxy: { configPath: "wrangler-media.toml", } }),
        })
      ]
    }
  } else {
    return {
      ...config,
      build: defaultBuild,
      ssr: { external: ['axios', 'react', 'react-dom', 'xmldom', 'xpath', 'tsqlstring'] },
      plugins: [
        ...defaultPlugins,
        pages({
          entry: "./src/index.production.tsx",
          outputDir: defaultBuild.outDir
        }),
        devServer({
          entry: 'src/index.dev.tsx',
          adapter,
          exclude: devExclude,
        }),
      ],
      server: {
        allowedHosts: ["dp7-test.cottonwind.com"],
      }
    } as UserConfig;
  }
})
