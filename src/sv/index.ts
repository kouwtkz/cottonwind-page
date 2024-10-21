import { Hono } from "hono";
import { SvCleanPages, SvLifeCheck, scheduleTask } from "./schedule";
export const app = new Hono<MeeBindings<MeeSvEnv>>();
const scheduled: ExportedHandlerScheduledHandler<MeeSvEnv> = async (event, env, ctx) => {
  ctx.waitUntil(scheduleTask(event, env));
};

app.get("/life", async (c, next) => {
  if (!import.meta.env?.DEV) return next();
  await SvLifeCheck(c.env);
  return c.text("");
})

app.get("/clean", async (c, next) => {
  if (!import.meta.env?.DEV) return next();
  const Url = new URL(c.req.url);
  const day = Url.searchParams.has("d") ? Number(Url.searchParams.get("d")) : null;
  await SvCleanPages(c.env, day && !isNaN(day) ? day : undefined);
  return c.text("");
})

export default {
  fetch: app.fetch,
  scheduled,
};
