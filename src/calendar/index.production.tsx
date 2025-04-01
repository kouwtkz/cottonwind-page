import { Hono } from "hono";
import { IndexRouteCalendar } from "./index.route";

const app = new Hono<MeeBindings<MeeCalendarEnv>>({ strict: true });

IndexRouteCalendar({
  app,
  beforeScript: <script type="module" src="/static/js/clientBefore.js" />,
  script: <script type="module" src="/assets/client.js" />,
});

export default app;
