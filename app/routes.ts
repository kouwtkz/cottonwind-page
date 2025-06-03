import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("test", "routes/test.tsx"),
  route("characters", "routes/charactersList.tsx", [
    route(":name", "routes/characters.tsx"),
  ]),
  route("media/*", "./media.ts"),
  route("api", "routes/api/index.ts", [
    route("data/:param", "routes/api/data.ts"),
    route("image/:action", "routes/api/image.ts"),
    route("character/:action", "routes/api/character.ts"),
    route("blog/:action", "routes/api/blog.ts"),
    route("sound/:action", "routes/api/sound.ts"),
    route("sound/album/:action", "routes/api/soundAlbum.ts"),
    route("file/:action", "routes/api/file.ts"),
    route("links/:action", "routes/api/links.ts"),
    route("links/fav/:action", "routes/api/links-fav.ts"),
    route("like/:action", "routes/api/like.ts"),
    route("kvdb/:action", "routes/api/KeyValueDB.ts"),
  ]),
] satisfies RouteConfig;
