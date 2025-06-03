import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("test", "routes/test.tsx"),
  route("characters", "routes/charactersList.tsx"),
  route("characters/:name", "routes/characters.tsx"),
  route("media/*", "./media.ts"),
  route("api", "routes/api/index.ts"),
  route("api/data/:param", "routes/api/data.ts"),
  route("api/image/:action", "routes/api/image.ts"),
  route("api/character/:action", "routes/api/character.ts"),
] satisfies RouteConfig;
