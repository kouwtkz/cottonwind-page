import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const envDev = loadEnv("development", process.cwd()) as ImportMetaEnv;

const allowedHosts: string[] = [];
if (envDev.VITE_LOCAL_TEST_DOMAIN) allowedHosts.push(envDev.VITE_LOCAL_TEST_DOMAIN);
if (envDev.VITE_LOCAL_TEST_DOMAIN_2) allowedHosts.push(envDev.VITE_LOCAL_TEST_DOMAIN_2);

export default defineConfig({
  server: {
    hmr: {
      overlay: false
    },
    allowedHosts,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
