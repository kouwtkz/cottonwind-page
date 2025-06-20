import { cloudflare, type PluginConfig } from "@cloudflare/vite-plugin";
import { defineConfig, loadEnv, type BuildOptions } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const envDev = loadEnv("development", process.cwd()) as ImportMetaEnv;

const allowedHosts: string[] = [];
if (envDev.VITE_LOCAL_TEST_DOMAIN) allowedHosts.push(envDev.VITE_LOCAL_TEST_DOMAIN);
if (envDev.VITE_LOCAL_TEST_DOMAIN_2) allowedHosts.push(envDev.VITE_LOCAL_TEST_DOMAIN_2);

export default defineConfig(async ({ mode }) => {
  const modes = mode.split("-");
  function includeModes(v: string) {
    return modes.some(m => m === v);
  }
  const workerMode = includeModes("worker");
  const cssMode = includeModes("css");
  const calendarMode = includeModes("calendar");
  const beforeClientMode = includeModes("beforeClient");
  let outDir: string | undefined;
  if (calendarMode) outDir = "dist/calendar/client";
  else outDir = "build/client";
  if (workerMode) {
    const input: string[] = [];
    if (envDev.VITE_PATH_SW_NOTIFICATION) input.push(envDev.VITE_PATH_SW_NOTIFICATION);
    if (envDev.VITE_PATH_WK_COUNTDOWN) input.push(envDev.VITE_PATH_WK_COUNTDOWN);
    return {
      build: {
        rollupOptions:
        {
          input,
          output: {
            entryFileNames: "[name].js"
          }
        },
        outDir,
        assetsDir: "",
        emptyOutDir: false,
      } as BuildOptions,
      plugins: [
        tsconfigPaths(),
      ]
    }
  } else if (cssMode) {
    const input: string[] = [];
    if (envDev.VITE_CSS_STYLES) input.push(envDev.VITE_CSS_STYLES);
    if (envDev.VITE_CSS_LIB) input.push(envDev.VITE_CSS_LIB);
    return {
      build: {
        rollupOptions:
        {
          input,
          output: {
            assetFileNames: "styles/[name].css"
          }
        },
        outDir,
        emptyOutDir: false,
      } as BuildOptions
    }
  } else if (beforeClientMode) {
    return {
      build: {
        rollupOptions: {
          input: [envDev.VITE_SSG_BEFORE_CLIENT],
          output: {
            entryFileNames: "[name].js"
          },
        },
        outDir,
        assetsDir: "",
        emptyOutDir: false,
      } as BuildOptions
    }
  } else {
    const build: BuildOptions = {};
    const cloudflareConfig: PluginConfig = { viteEnvironment: { name: "ssr" } };
    if (calendarMode) {
      cloudflareConfig.configPath = envDev.VITE_CALENDAR_CONFIG;
    }
    return {
      build,
      server: {
        hmr: {
          overlay: false
        },
        allowedHosts,
      },
      plugins: [
        cloudflare(cloudflareConfig),
        (await import("@react-router/dev/vite")).reactRouter(),
        tsconfigPaths(),
      ],
    }
  }
});
