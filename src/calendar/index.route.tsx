import { renderHtml } from "@/functions/render";
import { CommonHono } from "@/types/HonoCustomType";
import { CalendarAppLayout, CalendarAppNotFound } from "./CalendarAppLayout";

interface IndexRouteCalendarProps {
  app: CommonHono<MeeCalendarEnv>;
  script?: React.ReactNode;
  beforeScript?: React.ReactNode;
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
}
