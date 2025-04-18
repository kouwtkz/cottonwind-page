import { Hono } from "hono";
import { IndexRouteCalendar } from "./index.route";
import { serveStatic } from "@hono/node-server/serve-static";

import stylesMain from "@/styles.scss";
import stylesfromLib from "@/styles/styles_lib.scss";
import { appFromImportStyle } from "@/indexFunctions";
import { renderHtml } from "@/functions/render";
import { CalendarAppNotFound } from "./CalendarAppLayout";

const app = new Hono<MeeBindings<Object>>({ strict: true });

const dirBase = "/src/calendar";
const styles: [string, unknown][] = [
  ["styles", stylesMain],
  ["styles_lib", stylesfromLib],
];
appFromImportStyle({ styles, app, dir: "/assets" });

IndexRouteCalendar({ app });

const rootDir = "." + dirBase + "/";
app.get("/*", serveStatic({ root: `./public/` }));

app.all("*", async (c, next) => {
  return c.html(renderHtml(<CalendarAppNotFound />), { status: 404 });
});

export default app;
