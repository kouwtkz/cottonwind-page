import { Hono } from "hono";
import { IndexRouteCalendar } from "./index.route";

const app = new Hono<MeeBindings<Object>>({ strict: true });

IndexRouteCalendar({
  app,
  headScript: (
    <>
      <script type="module" src="/assets/clientBefore.js" />
      <script type="module" src="/assets/client.js" />
    </>
  ),
});

export default app;
