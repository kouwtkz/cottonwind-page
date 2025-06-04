import { Hono } from "hono";
import { IndexRouteCalendar } from "./index.route";

const app = new Hono<MeeBindings<Object>>({ strict: true });

IndexRouteCalendar({ app });

export default app;
