import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("test", "routes/test.tsx"),
  route("characters", "routes/charactersList.tsx"),
  route("characters/:name", "routes/characters.tsx"),
  route("media/*", "./media.ts"),
  route("api/*", "routes/api/index.ts"),
] satisfies RouteConfig;
