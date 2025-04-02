import { Hono } from "hono";
import { IndexRouteCalendar } from "./index.route";

const app = new Hono<MeeBindings<Object>>({ strict: true });

IndexRouteCalendar({
  app,
  beforeScript: <script type="module" src="/assets/clientBefore.js" />,
  script: <script type="module" src="/assets/client.js" />,
  meta: (
    <>
      <script type="module" src="/assets/setSw.js" />
    </>
  ),
});

export default app;
