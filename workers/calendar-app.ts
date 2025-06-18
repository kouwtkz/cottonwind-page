import { createRequestHandler } from "react-router";
import { calendarManifest } from "~/calendar/manifest";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const Url = new URL(request.url);
    if (Url.pathname.startsWith("/manifest.json")) {
      return Response.json(calendarManifest);
    } else {
      return requestHandler(request, {
        cloudflare: { env, ctx },
      });
    }
  },
} satisfies ExportedHandler<Env>;
