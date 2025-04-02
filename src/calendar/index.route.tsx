import { renderHtml } from "@/functions/render";
import { CommonHono } from "@/types/HonoCustomType";
import { CalendarAppLayout, CalendarAppNotFound } from "./CalendarAppLayout";

interface IndexRouteCalendarProps extends CalendarAppLayoutProps {
  app: CommonHono<Object>;
}
export function IndexRouteCalendar({ app, ...props }: IndexRouteCalendarProps) {
  app.get("/", async (c) => {
    return c.html(
      renderHtml(
        <CalendarAppLayout {...props}>
          <div id="root" />
        </CalendarAppLayout>
      )
    );
  });

  app.get("404.html", async (c) => {
    let status: number | undefined;
    if (import.meta.env?.DEV) status = 404;
    return c.html(renderHtml(<CalendarAppNotFound />), { status });
  });

  app.get("_routes.json", (c) => {
    const exclude = ["/*"];
    let include: Array<string> = [];
    const json = {
      version: 1,
      include,
      exclude,
    };
    return c.json(json);
  });

  app.get("manifest.json", async (c) => {
    return c.json({
      name: "めぇ式カレンダー",
      display: "standalone",
      scope: "/",
      start_url: "/",
      icons: [
        {
          src: "/static/images/png/faviconCalendar_150px.png",
          sizes: "150x150",
          type: "image/png",
        },
      ],
      share_target: {
        action: "/",
        params: {
          title: "name",
          text: "description",
          url: "link",
        },
      },
    } as webManifestType);
  });
}
