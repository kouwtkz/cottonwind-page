import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { configDotenv } from 'dotenv'
import { UserConfig, defineConfig } from 'vite'
import { writeFileSync } from "fs"

const localEnv = ".env.local"
function EnvBuildDateWrite() {
  const parsed = configDotenv({ path: localEnv }).parsed;
  const env: { [k: string]: string } = parsed ? parsed as any : {}
  env.VITE_BUILD_TIME = new Date().toLocaleString("sv-SE", { timeZone: "UTC" }).replace(" ", "T") + "Z";
  writeFileSync(localEnv, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"))
}

export default defineConfig(({ mode }) => {
  EnvBuildDateWrite();
  let config: UserConfig = {};
  if (mode === 'client') {
    config = {
      build: {
        target: ['es2022', 'edge89', 'firefox89', 'chrome89', 'safari15'],
        rollupOptions: {
          input: ['./src/client.tsx', './src/styles.css'],
          output: {
            entryFileNames: 'static/client.js',
            assetFileNames: ({ name, source, type }) => {
              if (name?.endsWith(".css")) {
                return 'static/' + name;
              } else {
                return ''
              }
            },
          }
        },
        chunkSizeWarningLimit: 3000,
        // manifest: true
      }
    };
  } else {
    config = {
      ssr: {
        external: ['react', 'react-dom']
      },
      assetsInclude: ["assets/*"],
      plugins: [
        pages(),
        devServer({
          entry: 'src/dev.tsx',
          adapter
        })
      ]
    }
  }
  config.optimizeDeps = { include: [] };
  return config;
})