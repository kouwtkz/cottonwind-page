import { Hono } from "hono";
import { scheduleTask } from "./schedule";
export const app = new Hono<MeeBindings<MeeCommonEnv>>();
const scheduled: ExportedHandlerScheduledHandler<MeeCommonEnv> = async (event, env, ctx) => {
  ctx.waitUntil(scheduleTask(event, env));
};
export default {
  fetch: app.fetch,
  scheduled,
};
