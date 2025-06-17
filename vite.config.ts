import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, loadEnv, type BuildOptions } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const envDev = loadEnv("development", process.cwd()) as ImportMetaEnv;

const allowedHosts: string[] = [];
if (envDev.VITE_LOCAL_TEST_DOMAIN) allowedHosts.push(envDev.VITE_LOCAL_TEST_DOMAIN);
if (envDev.VITE_LOCAL_TEST_DOMAIN_2) allowedHosts.push(envDev.VITE_LOCAL_TEST_DOMAIN_2);

export default defineConfig(async ({ mode }) => {
  if (mode === "worker") {
    const input: string[] = [];
    if (envDev.VITE_PATH_SW_NOTIFICATION) input.push(envDev.VITE_PATH_SW_NOTIFICATION);
    if (envDev.VITE_PATH_WK_COUNTDOWN) input.push(envDev.VITE_PATH_WK_COUNTDOWN);
    return {
      build: {
        rollupOptions:
        {
          input,
          output: {
            entryFileNames() {
              return `[name].js`;
            }
          }
        },
        outDir: "build/client",
        assetsDir: "",
        emptyOutDir: false,
      } as BuildOptions,
      plugins: [
        tsconfigPaths(),
      ]
    }
  } else {
    return {
      server: {
        hmr: {
          overlay: false
        },
        allowedHosts,
      },
      plugins: [
        cloudflare({ viteEnvironment: { name: "ssr" } }),
        (await import("@react-router/dev/vite")).reactRouter(),
        tsconfigPaths(),
      ],
    }
  }
});
