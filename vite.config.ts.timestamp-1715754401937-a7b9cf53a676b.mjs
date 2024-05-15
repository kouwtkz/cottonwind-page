// vite.config.ts
import pages from "file:///D:/Site/cottonwind-page/node_modules/@hono/vite-cloudflare-pages/dist/index.js";
import devServer from "file:///D:/Site/cottonwind-page/node_modules/@hono/vite-dev-server/dist/index.js";
import adapter from "file:///D:/Site/cottonwind-page/node_modules/@hono/vite-dev-server/dist/adapter/cloudflare.js";
import ssg from "file:///D:/Site/cottonwind-page/node_modules/@hono/vite-ssg/dist/index.js";
import { configDotenv } from "file:///D:/Site/cottonwind-page/node_modules/dotenv/lib/main.js";
import { defineConfig } from "file:///D:/Site/cottonwind-page/node_modules/vite/dist/node/index.js";
import { writeFileSync, statSync } from "fs";
import tsconfigPaths from "file:///D:/Site/cottonwind-page/node_modules/vite-tsconfig-paths/dist/index.mjs";
import Sitemap from "file:///D:/Site/cottonwind-page/node_modules/vite-plugin-sitemap/dist/index.js";

// src/routes/RoutingList.ts
var RoutingList = [
  "/",
  "character",
  "character/:charaName",
  "gallery",
  "gallery/ebook",
  "gallery/:group",
  "sound",
  "about"
];

// vite.config.ts
function DateUTCString(date = /* @__PURE__ */ new Date()) {
  return date.toLocaleString("sv-SE", { timeZone: "UTC" }).replace(" ", "T") + "Z";
}
function EnvBuildDateWrite() {
  const localEnv = ".env.local";
  const parsed = configDotenv({ path: localEnv }).parsed;
  const env = parsed ? parsed : {};
  env.VITE_BUILD_TIME = DateUTCString();
  const cssFile = "./src/styles.scss";
  try {
    env.VITE_STYLES_TIME = DateUTCString(statSync(cssFile).mtime);
  } catch {
  }
  writeFileSync(localEnv, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"));
}
var vite_config_default = defineConfig(({ mode }) => {
  EnvBuildDateWrite();
  let config = {
    optimizeDeps: { include: [] },
    plugins: [tsconfigPaths()]
  };
  if (mode === "client") {
    config.build = {
      rollupOptions: {
        input: [
          "./src/client.tsx",
          "./src/styles.scss",
          "src/workers/twix/twixClient.tsx"
        ],
        output: {
          entryFileNames: `static/js/[name].js`,
          chunkFileNames: `static/js/[name].js`,
          assetFileNames: (assetInfo) => {
            const name = assetInfo?.name ?? "";
            if (/\.(gif|jpeg|jpg|png|svg|webp)$/.test(name)) {
              return "static/images/[name].[ext]";
            }
            if (/\.css$/.test(name)) {
              return "css/[name].[ext]";
            }
            return "static/[name].[ext]";
          }
        }
      },
      // manifest: true,
      chunkSizeWarningLimit: 3e3
    };
  } else {
    configDotenv();
    config.ssr = { external: ["react", "react-dom", "xmldom", "xpath"] };
    config.plugins.push([
      pages(),
      devServer({
        entry: "src/index.dev.tsx",
        adapter,
        exclude: [
          // /.*\.css$/,
          /.*\.ts$/,
          /.*\.tsx$/,
          /^\/@.+$/,
          /\?t\=\d+$/,
          /^\/favicon\.ico$/,
          /^\/static\/.+/,
          /^\/node_modules\/.*/
        ]
      }),
      ssg({ entry: "./src/ssg.tsx" }),
      Sitemap({
        hostname: process.env.VITE_URL,
        generateRobotsTxt: true,
        dynamicRoutes: RoutingList.filter((v) => !/:/.test(v)),
        exclude: ["/404", "/500", "/suggest"]
      })
    ]);
  }
  return config;
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL3JvdXRlcy9Sb3V0aW5nTGlzdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXFNpdGVcXFxcY290dG9ud2luZC1wYWdlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxTaXRlXFxcXGNvdHRvbndpbmQtcGFnZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovU2l0ZS9jb3R0b253aW5kLXBhZ2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGFnZXMgZnJvbSAnQGhvbm8vdml0ZS1jbG91ZGZsYXJlLXBhZ2VzJ1xuaW1wb3J0IGRldlNlcnZlciBmcm9tICdAaG9uby92aXRlLWRldi1zZXJ2ZXInXG5pbXBvcnQgYWRhcHRlciBmcm9tICdAaG9uby92aXRlLWRldi1zZXJ2ZXIvY2xvdWRmbGFyZSdcbmltcG9ydCBzc2cgZnJvbSAnQGhvbm8vdml0ZS1zc2cnXG5pbXBvcnQgeyBjb25maWdEb3RlbnYgfSBmcm9tICdkb3RlbnYnXG5pbXBvcnQgeyBVc2VyQ29uZmlnLCBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgd3JpdGVGaWxlU3luYywgc3RhdFN5bmMgfSBmcm9tIFwiZnNcIlxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XG5pbXBvcnQgU2l0ZW1hcCBmcm9tIFwidml0ZS1wbHVnaW4tc2l0ZW1hcFwiO1xuLy8gaW1wb3J0IHsgc2VydmVyU2l0ZSB9IGZyb20gXCIuL3NyYy9kYXRhL3NlcnZlci9zaXRlXCI7XG5pbXBvcnQgeyBSb3V0aW5nTGlzdCB9IGZyb20gJy4vc3JjL3JvdXRlcy9Sb3V0aW5nTGlzdCdcblxuZnVuY3Rpb24gRGF0ZVVUQ1N0cmluZyhkYXRlOiBEYXRlID0gbmV3IERhdGUoKSkge1xuICByZXR1cm4gZGF0ZS50b0xvY2FsZVN0cmluZyhcInN2LVNFXCIsIHsgdGltZVpvbmU6IFwiVVRDXCIgfSkucmVwbGFjZShcIiBcIiwgXCJUXCIpICsgXCJaXCI7XG59XG5mdW5jdGlvbiBFbnZCdWlsZERhdGVXcml0ZSgpIHtcbiAgY29uc3QgbG9jYWxFbnYgPSBcIi5lbnYubG9jYWxcIlxuICBjb25zdCBwYXJzZWQgPSBjb25maWdEb3RlbnYoeyBwYXRoOiBsb2NhbEVudiB9KS5wYXJzZWQ7XG4gIGNvbnN0IGVudjogeyBbazogc3RyaW5nXTogc3RyaW5nIH0gPSBwYXJzZWQgPyBwYXJzZWQgYXMgYW55IDoge31cbiAgZW52LlZJVEVfQlVJTERfVElNRSA9IERhdGVVVENTdHJpbmcoKTtcbiAgY29uc3QgY3NzRmlsZSA9IFwiLi9zcmMvc3R5bGVzLnNjc3NcIjtcbiAgdHJ5IHtcbiAgICBlbnYuVklURV9TVFlMRVNfVElNRSA9IERhdGVVVENTdHJpbmcoc3RhdFN5bmMoY3NzRmlsZSkubXRpbWUpO1xuICB9IGNhdGNoIHsgfVxuICB3cml0ZUZpbGVTeW5jKGxvY2FsRW52LCBPYmplY3QuZW50cmllcyhlbnYpLm1hcCgoW2ssIHZdKSA9PiBgJHtrfT0ke3Z9YCkuam9pbihcIlxcblwiKSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgRW52QnVpbGREYXRlV3JpdGUoKTtcbiAgbGV0IGNvbmZpZzogVXNlckNvbmZpZyA9IHtcbiAgICBvcHRpbWl6ZURlcHM6IHsgaW5jbHVkZTogW10gfSxcbiAgICBwbHVnaW5zOiBbdHNjb25maWdQYXRocygpXVxuICB9O1xuICBpZiAobW9kZSA9PT0gJ2NsaWVudCcpIHtcbiAgICBjb25maWcuYnVpbGQgPSB7XG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIGlucHV0OiBbXG4gICAgICAgICAgJy4vc3JjL2NsaWVudC50c3gnLFxuICAgICAgICAgICcuL3NyYy9zdHlsZXMuc2NzcycsXG4gICAgICAgICAgJ3NyYy93b3JrZXJzL3R3aXgvdHdpeENsaWVudC50c3gnXG4gICAgICAgIF0sXG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiBgc3RhdGljL2pzL1tuYW1lXS5qc2AsXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6IGBzdGF0aWMvanMvW25hbWVdLmpzYCxcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGFzc2V0SW5mbz8ubmFtZSA/PyBcIlwiO1xuICAgICAgICAgICAgaWYgKC9cXC4oZ2lmfGpwZWd8anBnfHBuZ3xzdmd8d2VicCkkLy50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnc3RhdGljL2ltYWdlcy9bbmFtZV0uW2V4dF0nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKC9cXC5jc3MkLy50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnY3NzL1tuYW1lXS5bZXh0XSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ3N0YXRpYy9bbmFtZV0uW2V4dF0nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIC8vIG1hbmlmZXN0OiB0cnVlLFxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAzMDAwXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbmZpZ0RvdGVudigpO1xuICAgIGNvbmZpZy5zc3IgPSB7IGV4dGVybmFsOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICd4bWxkb20nLCAneHBhdGgnXSB9O1xuICAgIGNvbmZpZy5wbHVnaW5zIS5wdXNoKFtcbiAgICAgIHBhZ2VzKCksXG4gICAgICBkZXZTZXJ2ZXIoe1xuICAgICAgICBlbnRyeTogJ3NyYy9pbmRleC5kZXYudHN4JyxcbiAgICAgICAgYWRhcHRlcixcbiAgICAgICAgZXhjbHVkZTogW1xuICAgICAgICAgIC8vIC8uKlxcLmNzcyQvLFxuICAgICAgICAgIC8uKlxcLnRzJC8sXG4gICAgICAgICAgLy4qXFwudHN4JC8sXG4gICAgICAgICAgL15cXC9ALiskLyxcbiAgICAgICAgICAvXFw/dFxcPVxcZCskLyxcbiAgICAgICAgICAvXlxcL2Zhdmljb25cXC5pY28kLyxcbiAgICAgICAgICAvXlxcL3N0YXRpY1xcLy4rLyxcbiAgICAgICAgICAvXlxcL25vZGVfbW9kdWxlc1xcLy4qLyxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgc3NnKHsgZW50cnk6IFwiLi9zcmMvc3NnLnRzeFwiIH0pLFxuICAgICAgU2l0ZW1hcCh7XG4gICAgICAgIGhvc3RuYW1lOiBwcm9jZXNzLmVudi5WSVRFX1VSTCxcbiAgICAgICAgZ2VuZXJhdGVSb2JvdHNUeHQ6IHRydWUsXG4gICAgICAgIGR5bmFtaWNSb3V0ZXM6IFJvdXRpbmdMaXN0LmZpbHRlcih2ID0+ICEvOi8udGVzdCh2KSksXG4gICAgICAgIGV4Y2x1ZGU6IFtcIi80MDRcIiwgXCIvNTAwXCIsIFwiL3N1Z2dlc3RcIl1cbiAgICAgIH0pLFxuICAgIF0pXG4gIH1cbiAgcmV0dXJuIGNvbmZpZztcbn0pIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxTaXRlXFxcXGNvdHRvbndpbmQtcGFnZVxcXFxzcmNcXFxccm91dGVzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxTaXRlXFxcXGNvdHRvbndpbmQtcGFnZVxcXFxzcmNcXFxccm91dGVzXFxcXFJvdXRpbmdMaXN0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9TaXRlL2NvdHRvbndpbmQtcGFnZS9zcmMvcm91dGVzL1JvdXRpbmdMaXN0LnRzXCI7ZXhwb3J0IGNvbnN0IFJvdXRpbmdMaXN0ID0gW1xyXG4gIFwiL1wiLCBcImNoYXJhY3RlclwiLCBcImNoYXJhY3Rlci86Y2hhcmFOYW1lXCIsXHJcbiAgXCJnYWxsZXJ5XCIsIFwiZ2FsbGVyeS9lYm9va1wiLCBcImdhbGxlcnkvOmdyb3VwXCIsXHJcbiAgXCJzb3VuZFwiLCBcImFib3V0XCJcclxuXSBhcyBjb25zdDtcclxuZXhwb3J0IHR5cGUgUm91dGluZ1VuaW9uID0gdHlwZW9mIFJvdXRpbmdMaXN0W251bWJlcl07XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlAsT0FBTyxXQUFXO0FBQy9RLE9BQU8sZUFBZTtBQUN0QixPQUFPLGFBQWE7QUFDcEIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQXFCLG9CQUFvQjtBQUN6QyxTQUFTLGVBQWUsZ0JBQWdCO0FBQ3hDLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sYUFBYTs7O0FDUnFSLElBQU0sY0FBYztBQUFBLEVBQzNUO0FBQUEsRUFBSztBQUFBLEVBQWE7QUFBQSxFQUNsQjtBQUFBLEVBQVc7QUFBQSxFQUFpQjtBQUFBLEVBQzVCO0FBQUEsRUFBUztBQUNYOzs7QURRQSxTQUFTLGNBQWMsT0FBYSxvQkFBSSxLQUFLLEdBQUc7QUFDOUMsU0FBTyxLQUFLLGVBQWUsU0FBUyxFQUFFLFVBQVUsTUFBTSxDQUFDLEVBQUUsUUFBUSxLQUFLLEdBQUcsSUFBSTtBQUMvRTtBQUNBLFNBQVMsb0JBQW9CO0FBQzNCLFFBQU0sV0FBVztBQUNqQixRQUFNLFNBQVMsYUFBYSxFQUFFLE1BQU0sU0FBUyxDQUFDLEVBQUU7QUFDaEQsUUFBTSxNQUErQixTQUFTLFNBQWdCLENBQUM7QUFDL0QsTUFBSSxrQkFBa0IsY0FBYztBQUNwQyxRQUFNLFVBQVU7QUFDaEIsTUFBSTtBQUNGLFFBQUksbUJBQW1CLGNBQWMsU0FBUyxPQUFPLEVBQUUsS0FBSztBQUFBLEVBQzlELFFBQVE7QUFBQSxFQUFFO0FBQ1YsZ0JBQWMsVUFBVSxPQUFPLFFBQVEsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssSUFBSSxDQUFDO0FBQ3JGO0FBRUEsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsb0JBQWtCO0FBQ2xCLE1BQUksU0FBcUI7QUFBQSxJQUN2QixjQUFjLEVBQUUsU0FBUyxDQUFDLEVBQUU7QUFBQSxJQUM1QixTQUFTLENBQUMsY0FBYyxDQUFDO0FBQUEsRUFDM0I7QUFDQSxNQUFJLFNBQVMsVUFBVTtBQUNyQixXQUFPLFFBQVE7QUFBQSxNQUNiLGVBQWU7QUFBQSxRQUNiLE9BQU87QUFBQSxVQUNMO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsUUFDQSxRQUFRO0FBQUEsVUFDTixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGtCQUFNLE9BQU8sV0FBVyxRQUFRO0FBQ2hDLGdCQUFJLGlDQUFpQyxLQUFLLElBQUksR0FBRztBQUMvQyxxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxTQUFTLEtBQUssSUFBSSxHQUFHO0FBQ3ZCLHFCQUFPO0FBQUEsWUFDVDtBQUNBLG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUVBLHVCQUF1QjtBQUFBLElBQ3pCO0FBQUEsRUFDRixPQUFPO0FBQ0wsaUJBQWE7QUFDYixXQUFPLE1BQU0sRUFBRSxVQUFVLENBQUMsU0FBUyxhQUFhLFVBQVUsT0FBTyxFQUFFO0FBQ25FLFdBQU8sUUFBUyxLQUFLO0FBQUEsTUFDbkIsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLFFBQ1IsT0FBTztBQUFBLFFBQ1A7QUFBQSxRQUNBLFNBQVM7QUFBQTtBQUFBLFVBRVA7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxJQUFJLEVBQUUsT0FBTyxnQkFBZ0IsQ0FBQztBQUFBLE1BQzlCLFFBQVE7QUFBQSxRQUNOLFVBQVUsUUFBUSxJQUFJO0FBQUEsUUFDdEIsbUJBQW1CO0FBQUEsUUFDbkIsZUFBZSxZQUFZLE9BQU8sT0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7QUFBQSxRQUNuRCxTQUFTLENBQUMsUUFBUSxRQUFRLFVBQVU7QUFBQSxNQUN0QyxDQUFDO0FBQUEsSUFDSCxDQUFDO0FBQUEsRUFDSDtBQUNBLFNBQU87QUFDVCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
